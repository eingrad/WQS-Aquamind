import { Request, Response, NextFunction } from "express";
import * as deviceService from "../services/device.service";
import {
  createDeviceSchema,
  updateDeviceSchema,
  deviceQuerySchema,
} from "../utils/validation";
import { z } from "zod";

/**
 * Get all devices
 * GET /api/devices
 */
export const getAllDevices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = deviceQuerySchema.parse(req.query);
    const result = await deviceService.getAllDevices(query);

    res.status(200).json({
      success: true,
      data: result,
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
 * Get device by ID
 * GET /api/devices/:id
 */
export const getDeviceById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const device = await deviceService.getDeviceById(id);

    res.status(200).json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create device
 * POST /api/devices
 */
export const createDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = createDeviceSchema.parse(req.body);
    const device = await deviceService.createDevice(validatedData);

    res.status(201).json({
      success: true,
      message: "Device created successfully",
      data: device,
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
 * Update device
 * PUT /api/devices/:id
 */
export const updateDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updateDeviceSchema.parse(req.body);

    const device = await deviceService.updateDevice(id, validatedData);

    res.status(200).json({
      success: true,
      message: "Device updated successfully",
      data: device,
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
 * Delete device
 * DELETE /api/devices/:id
 */
export const deleteDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await deviceService.deleteDevice(id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get device statistics
 * GET /api/devices/stats
 */
export const getDeviceStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await deviceService.getDeviceStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
