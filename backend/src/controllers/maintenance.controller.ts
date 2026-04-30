import { Request, Response } from "express";
import * as maintenanceService from "../services/maintenance.service";
import {
  createMaintenanceSchema,
  maintenanceQuerySchema,
} from "../utils/validation";

const performedByFromUser = (req: Request): string | undefined => {
  const u = req.user;
  if (!u) return undefined;
  return u.username || u.email || u.userId;
};

/**
 * Create a new maintenance log
 * POST /api/devices/:deviceId/maintenance
 */
export const createMaintenance = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const validatedData = createMaintenanceSchema.parse(req.body);

    const performedBy = performedByFromUser(req);

    const maintenance = await maintenanceService.createMaintenanceLog(
      deviceId,
      new Date(validatedData.startTime),
      new Date(validatedData.endTime),
      validatedData.reason,
      validatedData.description,
      performedBy
    );

    res.status(201).json({
      success: true,
      data: maintenance,
      message: "Maintenance log created successfully",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    // Service-level validation errors (overlap, time order)
    if (
      error.message === "endTime must be after startTime" ||
      /overlaps an existing/.test(error.message)
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create maintenance log",
      details: error.message,
    });
  }
};

/**
 * Get all maintenance logs for a device
 * GET /api/devices/:deviceId/maintenance
 */
export const getMaintenanceLogs = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { limit } = maintenanceQuerySchema.parse(req.query);

    const logs = await maintenanceService.getMaintenanceLogs(deviceId, limit);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch maintenance logs",
      details: error.message,
    });
  }
};

/**
 * Get all maintenance logs across every device
 * GET /api/maintenance
 */
export const getAllMaintenance = async (req: Request, res: Response) => {
  try {
    const { limit } = maintenanceQuerySchema.parse(req.query);
    const logs = await maintenanceService.getAllMaintenanceLogs(limit);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch maintenance logs",
      details: error.message,
    });
  }
};

/**
 * Get active maintenance for a device
 * GET /api/devices/:deviceId/maintenance/active
 */
export const getActiveMaintenance = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const activeMaintenance = await maintenanceService.getActiveMaintenance(
      deviceId
    );

    if (!activeMaintenance) {
      return res.json({
        success: true,
        data: null,
        message: "No active maintenance",
      });
    }

    res.json({
      success: true,
      data: activeMaintenance,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch active maintenance",
      details: error.message,
    });
  }
};

/**
 * End maintenance early
 * PATCH /api/maintenance/:logId/end
 */
export const endMaintenance = async (req: Request, res: Response) => {
  try {
    const { logId } = req.params;

    const updated = await maintenanceService.endMaintenanceEarly(logId);

    res.json({
      success: true,
      data: updated,
      message: "Maintenance ended successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to end maintenance",
      details: error.message,
    });
  }
};

/**
 * Soft-delete a maintenance log
 * DELETE /api/maintenance/:logId
 */
export const deleteMaintenance = async (req: Request, res: Response) => {
  try {
    const { logId } = req.params;

    await maintenanceService.deleteMaintenanceLog(logId);

    res.json({
      success: true,
      message: "Maintenance log deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to delete maintenance log",
      details: error.message,
    });
  }
};
