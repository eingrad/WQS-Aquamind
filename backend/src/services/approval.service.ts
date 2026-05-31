import prisma from "../config/database";
import * as auditService from "./audit.service";
import * as notificationService from "./notification.service";

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

  // Audit logging (don't let it block notifications)
  try {
    await auditService.logFlagRequested(
      qcReviewerId,
      approvalRequest.approvalId,
      {
        deviceId,
        parameter,
        flagType,
        timeRange: {
          from: timeFrom,
          to: timeTo,
        },
        recordCount,
        qcRemarks: remarks,
      },
    );
  } catch (auditError) {
    console.error("⚠️ Audit logging failed (non-critical):", auditError);
    // Continue anyway - audit failure shouldn't block notifications
  }

  // Notify all admin users
  const allActiveUsers = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    include: {
      userRole: true,
    },
  });

  // Filter for admin users
  const adminUsers = allActiveUsers.filter(
    (user) => user.userRole?.roleId === "admin",
  );

  // Get device and QC user details for the notification
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    select: { name: true, location: true },
  });

  const qcUser = await prisma.user.findUnique({
    where: { id: qcReviewerId },
    select: { fullName: true },
  });

  // Format time range
  const timeRangeFormatted = `${timeFrom.toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} - ${timeTo.toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const flagTypeLabels: Record<string, string> = {
    out_of_range: "Out of Range",
    exceeding_range: "Exceeding Range",
    parameter_relation: "Parameter Relation",
    maintenance: "Maintenance",
    insufficient_data: "Insufficient Data",
  };

  const flagLabel = flagTypeLabels[flagType] || flagType;

  // Send notifications to all admins
  try {
    for (const admin of adminUsers) {
      await notificationService.sendInAppNotification({
        userId: admin.id,
        type: "approval_request",
        title: "New Approval Request",
        message: `Device: ${device?.name || "Unknown"} (${device?.location || "Unknown"})\nParameter: ${parameter.toUpperCase()}\nFlag Type: ${flagLabel}\nTime Range: ${timeRangeFormatted}\nRequested By: ${qcUser?.fullName || "Unknown"}\nRemarks: ${remarks}`,
        severity: "info",
        relatedEntityType: "APPROVAL_REQUEST",
        relatedEntityId: approvalRequest.approvalId,
      });
    }
  } catch (notificationError) {
    console.error("Failed to send notifications:", notificationError);
    // Don't throw - allow the request to succeed even if notifications fail
  }

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

  // Get record counts and hourly values for each approval
  const approvalsWithData = await Promise.all(
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

      //Calculate 1-hour aggregated value for the parameter
      const paramMap: Record<string, string> = {
        ph: "ph_value",
        do: "do_value",
        nh3n: "nh3_n_value",
        cod: "cod_value",
        bod: "bod_value",
        tss: "tss_value",
        temperature: "temp_value",
        pressure: "pressure_value",
        depth: "depth_value",
      };
      const columnName =
        paramMap[approval.parameterCode] || `${approval.parameterCode}_value`;
      const aggregation = await prisma.$queryRawUnsafe<any[]>(
        `SELECT AVG("${columnName}") as avg_value
         FROM telemetry_processed
         WHERE device_id = $1::uuid
           AND observed_at >= $2
           AND observed_at < $3`,
        approval.stationId,
        approval.timeFrom,
        approval.timeTo,
      );

      const hourlyValue = aggregation[0]?.avg_value
        ? Number(aggregation[0].avg_value)
        : null;

      return {
        ...approval,
        recordCount,
        hourlyValue,
      };
    }),
  );

  return approvalsWithData;
};

/**
 * Get all approval requests (for admin) - includes pending, approved, and rejected
 */
export const getAllApprovals = async (status?: string) => {
  const where: any = {
    approvalType: "flag",
  };

  // Add status filter if provided
  if (status && status !== "all") {
    where.adminStatus = status;
  }

  const approvals = await prisma.approvalRequest.findMany({
    where,
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

  // Get record counts and hourly values for each approval
  const approvalsWithData = await Promise.all(
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

      //Calculate 1-hour aggregated value for the parameter
      const paramMap: Record<string, string> = {
        ph: "ph_value",
        do: "do_value",
        nh3n: "nh3_n_value",
        cod: "cod_value",
        bod: "bod_value",
        tss: "tss_value",
        temperature: "temp_value",
        pressure: "pressure_value",
        depth: "depth_value",
      };
      const columnName =
        paramMap[approval.parameterCode] || `${approval.parameterCode}_value`;
      const aggregation = await prisma.$queryRawUnsafe<any[]>(
        `SELECT AVG("${columnName}") as avg_value
         FROM telemetry_processed
         WHERE device_id = $1::uuid
           AND observed_at >= $2
           AND observed_at < $3`,
        approval.stationId,
        approval.timeFrom,
        approval.timeTo,
      );

      const hourlyValue = aggregation[0]?.avg_value
        ? Number(aggregation[0].avg_value)
        : null;

      return {
        ...approval,
        recordCount,
        hourlyValue,
      };
    }),
  );

  return approvalsWithData;
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
        }),
      ),
    );

    return {
      approval: updatedApproval,
      createdValidationRecords: createdRecords.length,
    };
  });

  // Audit logging
  await auditService.logFlagApproved(adminId, approvalId, {
    deviceId: approval.stationId,
    parameter: approval.parameterCode,
    flagType: approval.flagType!,
    timeRange: {
      from: approval.timeFrom,
      to: approval.timeTo,
    },
    recordCount: result.createdValidationRecords,
    adminRemarks,
  });

  // Notify the QC user that their request was approved
  const device = await prisma.device.findUnique({
    where: { id: approval.stationId },
    select: { name: true, location: true },
  });

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { fullName: true },
  });

  const timeRangeFormatted = `${approval.timeFrom.toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} - ${approval.timeTo.toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  if (approval.qcReviewerId) {
    await notificationService.sendInAppNotification({
      userId: approval.qcReviewerId,
      type: "approval_decision",
      title: "Flag Request Approved",
      message: `Your flag request has been approved\nParameter: ${approval.parameterCode.toUpperCase()}\nDevice: ${device?.name || "Unknown"} (${device?.location || "Unknown"})\nTime Range: ${timeRangeFormatted}\nAdmin: ${admin?.fullName || "Unknown"}${adminRemarks ? `\nRemarks: ${adminRemarks}` : ""}`,
      severity: "info",
      relatedEntityType: "APPROVAL_REQUEST",
      relatedEntityId: approvalId,
    });
  }

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

  // Audit logging
  await auditService.logFlagRejected(adminId, approvalId, {
    deviceId: approval.stationId,
    parameter: approval.parameterCode,
    flagType: approval.flagType!,
    timeRange: {
      from: approval.timeFrom,
      to: approval.timeTo,
    },
    adminRemarks,
  });

  // Notify the QC user that their request was rejected
  const device = await prisma.device.findUnique({
    where: { id: approval.stationId },
    select: { name: true, location: true },
  });

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { fullName: true },
  });

  const timeRangeFormatted = `${approval.timeFrom.toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} - ${approval.timeTo.toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  if (approval.qcReviewerId) {
    await notificationService.sendInAppNotification({
      userId: approval.qcReviewerId,
      type: "approval_decision",
      title: "Flag Request Rejected",
      message: `Your flag request has been rejected\nParameter: ${approval.parameterCode.toUpperCase()}\nDevice: ${device?.name || "Unknown"} (${device?.location || "Unknown"})\nTime Range: ${timeRangeFormatted}\nAdmin: ${admin?.fullName || "Unknown"}\nRemarks: ${adminRemarks}`,
      severity: "warning",
      relatedEntityType: "APPROVAL_REQUEST",
      relatedEntityId: approvalId,
    });
  }

  console.log(
    `❌ Notified QC user of rejected flag request for ${approval.parameterCode}`,
  );

  return updatedApproval;
};

export default {
  createFlagRequest,
  getPendingApprovals,
  getAllApprovals,
  getMyRequests,
  approveFlag,
  rejectFlag,
};
