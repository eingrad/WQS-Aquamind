import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as approvalService from "../services/approval.service";

/**
 * Validation schemas
 */
const createFlagRequestSchema = z.object({
  deviceId: z.string().uuid("Invalid device ID"),
  hourTimestamp: z.string().datetime("Invalid timestamp"),
  parameter: z.enum([
    "ph",
    "do",
    "nh3n",
    "cod",
    "bod",
    "tss",
    "temperature",
    "pressure",
    "depth",
  ]),
  flagType: z.enum([
    "valid",
    "exceeding_range",
    "out_of_range",
    "parameter_relation",
    "maintenance",
    "insufficient_data",
  ]),
  remarks: z
    .string()
    .min(10, "Remarks must be at least 10 characters")
    .max(1000, "Remarks must not exceed 1000 characters"),
});

const approveFlagSchema = z.object({
  approvalId: z.string().uuid("Invalid approval ID"),
  adminRemarks: z.string().max(1000).optional(),
});

const rejectFlagSchema = z.object({
  approvalId: z.string().uuid("Invalid approval ID"),
  adminRemarks: z
    .string()
    .min(10, "Admin remarks are required for rejection")
    .max(1000),
});

const getMyRequestsSchema = z.object({
  status: z.enum(["all", "pending", "approved", "rejected"]).optional(),
});

/**
 * POST /api/validation/request-flag
 * QC user submits a flag request
 */
export const requestFlag = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedData = createFlagRequestSchema.parse(req.body);

    // Get current user ID from auth (assumes auth middleware sets req.user)
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const result = await approvalService.createFlagRequest({
      ...validatedData,
      hourTimestamp: new Date(validatedData.hourTimestamp),
      qcReviewerId: userId,
    });

    res.status(201).json({
      success: true,
      message: "Flag request submitted. Awaiting admin approval.",
      data: {
        approvalId: result.approvalRequest.approvalId,
        status: result.approvalRequest.adminStatus,
        recordCount: result.recordCount,
        timeRange: result.timeRange,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    next(error);
  }
};

/**
 * GET /api/validation/pending-approvals
 * Admin views all pending approval requests
 */
export const getPendingApprovals = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const approvals = await approvalService.getPendingApprovals();

    res.json({
      success: true,
      data: approvals.map((approval) => ({
        approvalId: approval.approvalId,
        device: {
          id: approval.stationId,
          name: approval.station.name,
          location: approval.station.location,
        },
        parameter: approval.parameterCode,
        flagType: approval.flagType,
        timeRange: {
          from: approval.timeFrom,
          to: approval.timeTo,
        },
        requestedBy: {
          name: approval.qcReviewer?.fullName ?? "Deleted User",
          email: approval.qcReviewer?.email ?? "N/A",
        },
        requestedAt: approval.qcReviewedAt,
        qcRemarks: approval.qcRemarks,
        recordCount: approval.recordCount,
        hourlyValue: approval.hourlyValue,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/validation/all-approvals
 * Admin views all approval requests (pending, approved, rejected)
 */
export const getAllApprovals = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedQuery = getMyRequestsSchema.parse(req.query);

    const approvals = await approvalService.getAllApprovals(
      validatedQuery.status,
    );

    res.json({
      success: true,
      data: approvals.map((approval) => ({
        approvalId: approval.approvalId,
        device: {
          id: approval.stationId,
          name: approval.station.name,
          location: approval.station.location,
        },
        parameter: approval.parameterCode,
        flagType: approval.flagType,
        status: approval.adminStatus,
        timeRange: {
          from: approval.timeFrom,
          to: approval.timeTo,
        },
        requestedBy: {
          name: approval.qcReviewer?.fullName ?? "Deleted User",
          email: approval.qcReviewer?.email ?? "N/A",
        },
        requestedAt: approval.qcReviewedAt,
        qcRemarks: approval.qcRemarks,
        recordCount: approval.recordCount,
        hourlyValue: approval.hourlyValue,
        adminRemarks: approval.adminRemarks,
        decidedAt: approval.adminDecidedAt,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    next(error);
  }
};

/**
 * GET /api/validation/my-requests
 * QC user views their own approval requests
 */
export const getMyRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedQuery = getMyRequestsSchema.parse(req.query);

    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const requests = await approvalService.getMyRequests(
      userId,
      validatedQuery.status,
    );

    res.json({
      success: true,
      data: requests.map((request) => ({
        approvalId: request.approvalId,
        device: {
          id: request.stationId,
          name: request.station.name,
          location: request.station.location,
        },
        parameter: request.parameterCode,
        flagType: request.flagType,
        timeRange: {
          from: request.timeFrom,
          to: request.timeTo,
        },
        status: request.adminStatus,
        qcRemarks: request.qcRemarks,
        requestedAt: request.qcReviewedAt,
        adminRemarks: request.adminRemarks,
        decidedAt: request.adminDecidedAt,
        decidedBy: request.admin
          ? {
              name: request.admin.fullName,
              email: request.admin.email,
            }
          : null,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    next(error);
  }
};

/**
 * POST /api/validation/approve-flag
 * Admin approves a flag request
 */
export const approveFlag = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedData = approveFlagSchema.parse(req.body);

    const userId = (req as any).user?.userId;

    const result = await approvalService.approveFlag({
      ...validatedData,
      adminId: userId,
    });

    res.json({
      success: true,
      message: `Flag approved and applied to ${result.createdValidationRecords} records`,
      data: {
        approvalId: result.approval.approvalId,
        status: result.approval.adminStatus,
        createdValidationRecords: result.createdValidationRecords,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    next(error);
  }
};

/**
 * POST /api/validation/reject-flag
 * Admin rejects a flag request
 */
export const rejectFlag = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedData = rejectFlagSchema.parse(req.body);

    const userId = (req as any).user?.userId;

    const result = await approvalService.rejectFlag({
      ...validatedData,
      adminId: userId,
    });

    res.json({
      success: true,
      message: "Flag request rejected",
      data: {
        approvalId: result.approvalId,
        status: result.adminStatus,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    next(error);
  }
};

export default {
  requestFlag,
  getPendingApprovals,
  getAllApprovals,
  getMyRequests,
  approveFlag,
  rejectFlag,
};
