import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Approval Service
 * Handles flag request creation, approval, and rejection workflows
 */

interface CreateFlagRequestParams {
  deviceId: string;
  hourTimestamp: Date;
  parameter: string;
  flagType: string;
  remarks: string;
  qcReviewerId: string;
}

interface ApproveFlagParams {
  approvalId: string;
  adminId: string;
  adminRemarks?: string;
}

interface RejectFlagParams {
  approvalId: string;
  adminId: string;
  adminRemarks: string; // Required for rejection
}

/**
 * Create a flag request (QC user submits)
 * Creates an ApprovalRequest record with status='pending'
 */
export const createFlagRequest = async (params: CreateFlagRequestParams) => {
  const {
    deviceId,
    hourTimestamp,
    parameter,
    flagType,
    remarks,
    qcReviewerId,
  } = params;

  // Round to hour start
  const timeFrom = new Date(hourTimestamp);
  timeFrom.setMinutes(0, 0, 0);

  // Calculate hour end
  const timeTo = new Date(timeFrom);
  timeTo.setHours(timeTo.getHours() + 1);

  // Get count of telemetry records in this hour
  const recordCount = await prisma.telemetryProcessed.count({
    where: {
      deviceId,
      observedAt: {
        gte: timeFrom,
        lt: timeTo,
      },
    },
  });

  // Create approval request
  const approvalRequest = await prisma.approvalRequest.create({
    data: {
      stationId: deviceId,
      parameterCode: parameter,
      timeFrom,
      timeTo,
      approvalType: "flag", // Distinguishes from value change approvals
      flagType,
      qcReviewerId,
      qcRemarks: remarks,
      adminStatus: "pending",
    },
  });

  return {
    approvalRequest,
    recordCount,
    timeRange: {
      from: timeFrom,
      to: timeTo,
    },
  };
};

/**
 * Get all pending approval requests (for admin)
 */
export const getPendingApprovals = async () => {
  const approvals = await prisma.approvalRequest.findMany({
    where: {
      adminStatus: "pending",
      approvalType: "flag",
    },
    include: {
      station: {
        select: {
          name: true,
          location: true,
        },
      },
      qcReviewer: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      qcReviewedAt: "desc",
    },
  });

  // Get record counts for each approval
  const approvalsWithCounts = await Promise.all(
    approvals.map(async (approval) => {
      const recordCount = await prisma.telemetryProcessed.count({
        where: {
          deviceId: approval.stationId,
          observedAt: {
            gte: approval.timeFrom,
            lt: approval.timeTo,
          },
        },
      });

      return {
        ...approval,
        recordCount,
      };
    })
  );

  return approvalsWithCounts;
};

/**
 * Get a QC user's approval requests
 */
export const getMyRequests = async (userId: string, status?: string) => {
  const where: any = {
    qcReviewerId: userId,
    approvalType: "flag",
  };

  if (status && status !== "all") {
    where.adminStatus = status;
  }

  const requests = await prisma.approvalRequest.findMany({
    where,
    include: {
      station: {
        select: {
          name: true,
          location: true,
        },
      },
      admin: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      qcReviewedAt: "desc",
    },
  });

  return requests;
};

/**
 * Approve a flag request
 * Updates ApprovalRequest and creates ValidationStatus records for all 60 minutes
 */
export const approveFlag = async (params: ApproveFlagParams) => {
  const { approvalId, adminId, adminRemarks } = params;

  // Get the approval request
  const approval = await prisma.approvalRequest.findUnique({
    where: { approvalId },
  });

  if (!approval) {
    throw new Error("Approval request not found");
  }

  if (approval.adminStatus !== "pending") {
    throw new Error(`Request already ${approval.adminStatus}. Cannot approve.`);
  }

  // Get all telemetry records in the hour range
  const telemetryRecords = await prisma.telemetryProcessed.findMany({
    where: {
      deviceId: approval.stationId,
      observedAt: {
        gte: approval.timeFrom,
        lt: approval.timeTo,
      },
    },
    select: {
      recordId: true,
      observedAt: true,
    },
  });

  if (telemetryRecords.length === 0) {
    throw new Error("No telemetry records found for this time range");
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update approval request
    const updatedApproval = await tx.approvalRequest.update({
      where: { approvalId },
      data: {
        adminStatus: "approved",
        adminId,
        adminDecidedAt: new Date(),
        adminRemarks,
      },
    });

    // 2. Create ValidationStatus records for each telemetry record
    const validationStatusRecords = telemetryRecords.map((record) => ({
      recordId: record.recordId,
      deviceId: approval.stationId,
      observedAt: record.observedAt,
      parameter: approval.parameterCode,
      status: approval.flagType!,
      flaggedByHuman: true,
      validatedBy: approval.qcReviewerId,
      validatedAt: new Date(),
      remarks: adminRemarks
        ? `${approval.qcRemarks}\n\nAdmin: ${adminRemarks}`
        : approval.qcRemarks,
    }));

    // Upsert each validation status (in case already exists)
    const createdRecords = await Promise.all(
      validationStatusRecords.map((record) =>
        tx.validationStatus.upsert({
          where: {
            recordId_parameter: {
              recordId: record.recordId,
              parameter: record.parameter,
            },
          },
          update: {
            status: record.status,
            flaggedByHuman: record.flaggedByHuman,
            validatedBy: record.validatedBy,
            validatedAt: record.validatedAt,
            remarks: record.remarks,
          },
          create: record,
        })
      )
    );

    return {
      approval: updatedApproval,
      createdValidationRecords: createdRecords.length,
    };
  });

  return result;
};

/**
 * Reject a flag request
 * Only updates ApprovalRequest status, does NOT create ValidationStatus records
 */
export const rejectFlag = async (params: RejectFlagParams) => {
  const { approvalId, adminId, adminRemarks } = params;

  // Get the approval request
  const approval = await prisma.approvalRequest.findUnique({
    where: { approvalId },
  });

  if (!approval) {
    throw new Error("Approval request not found");
  }

  if (approval.adminStatus !== "pending") {
    throw new Error(`Request already ${approval.adminStatus}. Cannot reject.`);
  }

  // Update approval request
  const updatedApproval = await prisma.approvalRequest.update({
    where: { approvalId },
    data: {
      adminStatus: "rejected",
      adminId,
      adminDecidedAt: new Date(),
      adminRemarks,
    },
  });

  return updatedApproval;
};

export default {
  createFlagRequest,
  getPendingApprovals,
  getMyRequests,
  approveFlag,
  rejectFlag,
};
