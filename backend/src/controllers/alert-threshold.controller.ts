import { Request, Response } from "express";
import { z } from "zod";
import * as thresholdService from "../services/alert-threshold.service";

/**
 * Validation schemas
 */
// Canonical parameter codes used across the alert pipeline.
// MQTT ingest produces these names directly, the validator stores them in
// validation_status.parameter, and alert-evaluation matches alert thresholds
// against them. Keep this list in sync with backend/src/services/mqtt.service.ts
// CHANNEL_MAP and the ranges in parameter-ranges.ts.
const ALERT_PARAMETER_CODES = [
  "ph",
  "do",
  "nh3n",
  "cod",
  "bod",
  "tss",
  "temperature",
  "pressure",
  "depth",
] as const;

const createThresholdSchema = z.object({
  deviceId: z.string().uuid().optional(),
  parameter: z.enum(ALERT_PARAMETER_CODES),
  thresholdType: z.enum(["warning", "critical", "emergency"]),
  operator: z.enum([">", "<", ">=", "<=", "=="]),
  value: z.number(),
  cooldownMinutes: z.number().min(5).max(1440).optional(), // 5 minutes to 24 hours
});

const updateThresholdSchema = z.object({
  deviceId: z.string().uuid().optional(),
  parameter: z.enum(ALERT_PARAMETER_CODES).optional(),
  thresholdType: z.enum(["warning", "critical", "emergency"]).optional(),
  operator: z.enum([">", "<", ">=", "<=", "=="]).optional(),
  value: z.number().optional(),
  cooldownMinutes: z.number().min(5).max(1440).optional(),
});

const toggleThresholdSchema = z.object({
  enabled: z.boolean(),
});

/**
 * Get all thresholds
 * GET /api/alerts/thresholds
 */
export const getThresholds = async (req: Request, res: Response) => {
  try {
    const { deviceId, parameter, enabled } = req.query;

    const thresholds = await thresholdService.getThresholds({
      deviceId: deviceId as string,
      parameter: parameter as string,
      enabled:
        enabled === "true" ? true : enabled === "false" ? false : undefined,
    });

    res.json({
      success: true,
      data: thresholds,
      count: thresholds.length,
    });
  } catch (error: any) {
    console.error("Error fetching thresholds:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch thresholds",
      error: error.message,
    });
  }
};

/**
 * Get single threshold by ID
 * GET /api/alerts/thresholds/:id
 */
export const getThresholdById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const threshold = await thresholdService.getThresholdById(id);

    res.json({
      success: true,
      data: threshold,
    });
  } catch (error: any) {
    console.error("Error fetching threshold:", error);

    if (error.message === "Threshold not found") {
      return res.status(404).json({
        success: false,
        message: "Threshold not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch threshold",
      error: error.message,
    });
  }
};

/**
 * Create new threshold (admin only)
 * POST /api/alerts/thresholds
 */
export const createThreshold = async (req: Request, res: Response) => {
  try {
    const validatedData = createThresholdSchema.parse(req.body);
    const userId = (req as any).user.userId; // From auth middleware

    const threshold = await thresholdService.createThreshold({
      ...validatedData,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      message: "Threshold created successfully",
      data: threshold,
    });
  } catch (error: any) {
    console.error("Error creating threshold:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create threshold",
      error: error.message,
    });
  }
};

/**
 * Update threshold (admin only)
 * PUT /api/alerts/thresholds/:id
 */
export const updateThreshold = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateThresholdSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const threshold = await thresholdService.updateThreshold(
      id,
      validatedData,
      userId,
    );

    res.json({
      success: true,
      message: "Threshold updated successfully",
      data: threshold,
    });
  } catch (error: any) {
    console.error("Error updating threshold:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.issues,
      });
    }

    if (error.message === "Threshold not found") {
      return res.status(404).json({
        success: false,
        message: "Threshold not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update threshold",
      error: error.message,
    });
  }
};

/**
 * Delete threshold (admin only)
 * DELETE /api/alerts/thresholds/:id
 */
export const deleteThreshold = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const result = await thresholdService.deleteThreshold(id, userId);

    res.json({
      success: true,
      message: "Threshold deleted successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error deleting threshold:", error);

    if (error.message === "Threshold not found") {
      return res.status(404).json({
        success: false,
        message: "Threshold not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete threshold",
      error: error.message,
    });
  }
};

/**
 * Toggle threshold enabled/disabled (admin only)
 * PATCH /api/alerts/thresholds/:id/toggle
 */
export const toggleThreshold = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled } = toggleThresholdSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const threshold = await thresholdService.toggleThreshold(
      id,
      enabled,
      userId,
    );

    res.json({
      success: true,
      message: `Threshold ${enabled ? "enabled" : "disabled"} successfully`,
      data: threshold,
    });
  } catch (error: any) {
    console.error("Error toggling threshold:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to toggle threshold",
      error: error.message,
    });
  }
};

export default {
  getThresholds,
  getThresholdById,
  createThreshold,
  updateThreshold,
  deleteThreshold,
  toggleThreshold,
};
