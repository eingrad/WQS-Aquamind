import { Request, Response } from "express";
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
export const getAlertHistory = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error("Error fetching alert history:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch alert history",
      error: error.message,
    });
  }
};

/**
 * Get single alert by ID
 * GET /api/alerts/history/:id
 */
export const getAlertById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const alerts = await alertEvaluation.getAlertHistory({ limit: 1 });
    const alert = alerts.find((a) => a.id === id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error: any) {
    console.error("Error fetching alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alert",
      error: error.message,
    });
  }
};

/**
 * Acknowledge an alert
 * PATCH /api/alerts/history/:id/acknowledge
 */
export const acknowledgeAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const alert = await alertEvaluation.acknowledgeAlert(id, userId);

    res.json({
      success: true,
      message: "Alert acknowledged successfully",
      data: alert,
    });
  } catch (error: any) {
    console.error("Error acknowledging alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to acknowledge alert",
      error: error.message,
    });
  }
};

export default {
  getAlertHistory,
  getAlertById,
  acknowledgeAlert,
};
