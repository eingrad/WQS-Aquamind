import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as alertEvaluation from "../services/alert-evaluation.service";

/**
 * Validation schemas
 */
const getAlertHistorySchema = z.object({
  deviceId: z.string().uuid().optional(),
  parameter: z.string().optional(),
  thresholdType: z.enum(["warning", "critical", "emergency"]).optional(),
  acknowledged: z.string().optional(), // "true" or "false"
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().optional(),
});

const acknowledgeAlertSchema = z.object({
  // No body needed, user ID from auth middleware
});

/**
 * Get alert history with filtering
 * GET /api/alerts/history
 */
export const getAlertHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = getAlertHistorySchema.parse(req.query);

    const filters: any = {
      deviceId: validatedQuery.deviceId,
      parameter: validatedQuery.parameter,
      thresholdType: validatedQuery.thresholdType,
      acknowledged:
        validatedQuery.acknowledged === "true"
          ? true
          : validatedQuery.acknowledged === "false"
            ? false
            : undefined,
      startDate: validatedQuery.startDate
        ? new Date(validatedQuery.startDate)
        : undefined,
      endDate: validatedQuery.endDate
        ? new Date(validatedQuery.endDate)
        : undefined,
      limit: validatedQuery.limit ? parseInt(validatedQuery.limit) : 100,
    };

    const alerts = await alertEvaluation.getAlertHistory(filters);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.issues,
      });
      return;
    }
    next(error);
  }
};

/**
 * Get single alert by ID
 * GET /api/alerts/history/:id
 */
export const getAlertById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const alerts = await alertEvaluation.getAlertHistory({ limit: 1 });
    const alert = alerts.find((a) => a.id === id);

    if (!alert) {
      res.status(404).json({
        success: false,
        message: "Alert not found",
      });
      return;
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Acknowledge an alert
 * PATCH /api/alerts/history/:id/acknowledge
 */
export const acknowledgeAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Validate user authentication
    if (!user || !user.userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const userId = user.userId;

    const alert = await alertEvaluation.acknowledgeAlert(id, userId);

    // Convert Decimal to number for JSON serialization
    const responseData = {
      ...alert,
      actualValue: Number(alert.actualValue),
      thresholdValue: Number(alert.thresholdValue),
      threshold: {
        ...alert.threshold,
        value: Number(alert.threshold.value),
      },
    };

    res.json({
      success: true,
      message: "Alert acknowledged successfully",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAlertHistory,
  getAlertById,
  acknowledgeAlert,
};
