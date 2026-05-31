import { Request, Response, NextFunction } from "express";
import * as telemetryService from "../services/telemetry.service";
import {
  createReadingSchema,
  bulkReadingsSchema,
  readingsQuerySchema,
} from "../utils/validation";
import { z } from "zod";
import { convertSensorTimestampToUTC } from "../utils/timezone";

/**
 * Create a new sensor reading
 * POST /api/sensors/readings
 */
export const createReading = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = createReadingSchema.parse(req.body);

    const reading = await telemetryService.createReading({
      deviceId: validatedData.deviceId,
      observedAt: convertSensorTimestampToUTC(validatedData.observedAt),
      readings: validatedData.readings,
    });

    res.status(201).json({
      success: true,
      message: "Reading created successfully",
      data: reading,
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
 * Create multiple sensor readings (bulk)
 * POST /api/sensors/readings/bulk
 */
export const createReadingsBulk = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = bulkReadingsSchema.parse(req.body);

    const results = await telemetryService.createReadingsBulk(
      validatedData.readings.map((r) => ({
        deviceId: r.deviceId,
        observedAt: convertSensorTimestampToUTC(r.observedAt),
        readings: r.readings,
      }))
    );

    res.status(201).json({
      success: true,
      message: `${results.count} readings created successfully`,
      data: results,
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
 * Get sensor readings with filtering
 * GET /api/sensors/readings
 */
export const getReadings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = readingsQuerySchema.parse(req.query);

    const options: any = {
      page: query.page,
      limit: query.limit,
      deviceId: query.deviceId,
      parameter: query.parameter,
      dataQuality: query.dataQuality,
    };

    if (query.startDate) {
      options.startDate = new Date(query.startDate);
    }
    if (query.endDate) {
      options.endDate = new Date(query.endDate);
    }

    const result = await telemetryService.getReadings(options);

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
 * Get reading by ID
 * GET /api/sensors/readings/:id
 */
export const getReadingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const reading = await telemetryService.getReadingById(id);

    res.status(200).json({
      success: true,
      data: reading,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get latest readings
 * GET /api/sensors/readings/latest
 */
export const getLatestReadings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { deviceId, limit } = req.query;
    const readings = await telemetryService.getLatestReadings(
      deviceId as string | undefined,
      limit ? parseInt(limit as string) : 10
    );

    res.status(200).json({
      success: true,
      data: readings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get time-series aggregated data
 * GET /api/sensors/readings/time-series
 */
export const getTimeSeries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { timeSeriesQuerySchema } = await import("../utils/validation");
    const query = timeSeriesQuerySchema.parse(req.query);

    const result = await telemetryService.getTimeSeriesData({
      deviceId: query.deviceId,
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      interval: query.interval,
      parameters: query.parameters || "ph,do,nh3n", // Provide default if undefined
    });

    res.status(200).json({
      success: true,
      data: {
        timeSeries: result, // Wrap in timeSeries property for frontend compatibility
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
 * Get hourly averages for a parameter
 * GET /api/sensors/readings/hourly-avg
 */
export const getHourlyAverages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { hourlyAvgQuerySchema } = await import("../utils/validation");
    const query = hourlyAvgQuerySchema.parse(req.query);

    const result = await telemetryService.getHourlyAverages({
      deviceId: query.deviceId,
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      parameter: query.parameter,
    });

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
 * Get device status (check if device is currently active)
 * GET /api/sensors/device-status?deviceId=xxx
 */
export const getDeviceStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { deviceId } = req.query;

    if (!deviceId || typeof deviceId !== "string") {
      res.status(400).json({
        success: false,
        error: "deviceId is required",
      });
      return;
    }

    const latestReading = await telemetryService.getLatestReading(deviceId);

    if (!latestReading) {
      res.status(200).json({
        success: true,
        data: {
          isActive: false,
          latestTimestamp: null,
          hoursSinceLastData: null,
        },
      });
      return;
    }

    const now = new Date();
    const lastDataTime = new Date(latestReading.observedAt);
    const hoursSinceLastData =
      (now.getTime() - lastDataTime.getTime()) / (1000 * 60 * 60);
    const isActive = hoursSinceLastData <= 3;

    res.status(200).json({
      success: true,
      data: {
        isActive,
        latestTimestamp: latestReading.observedAt,
        hoursSinceLastData: Number(hoursSinceLastData.toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};
