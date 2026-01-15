import { Request, Response, NextFunction } from "express";
import * as telemetryService from "../services/telemetry.service";
import {
  createReadingSchema,
  bulkReadingsSchema,
  readingsQuerySchema,
} from "../utils/validation";
import { rawReadingSchema } from "../utils/validation-raw";
import { z } from "zod";
import { convertSensorTimestampToUTC } from "../utils/timezone";
import * as bufferService from "../services/telemetry/buffer/buffer.service";

/**
 * Store raw 5-second sensor reading in Redis buffer
 * POST /api/sensors/raw
 * NEW ENDPOINT - doesn't affect existing /readings endpoint
 */
export const storeRawReading = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = rawReadingSchema.parse(req.body);

    // Convert timestamp to UTC
    const timestamp = convertSensorTimestampToUTC(validatedData.timestamp);

    // Store in Redis buffer (gracefully fails if Redis unavailable)
    const stored = await bufferService.storeRawReading(
      validatedData.deviceId,
      timestamp,
      validatedData.readings
    );

    if (!stored) {
      // Redis unavailable - warn but don't fail
      console.warn("⚠️ Redis unavailable - reading  not buffered");
      res.status(202).json({
        success: true,
        message: "Reading accepted but not buffered (Redis unavailable)",
        buffered: false,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "Raw reading stored in buffer",
      buffered: true,
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
