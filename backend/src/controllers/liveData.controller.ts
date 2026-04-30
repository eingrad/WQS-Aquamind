import { Request, Response, NextFunction } from "express";
import redis from "../services/redis.service";
import {
  getWindRoseHistogram,
  getPollutionRoseHistogram,
} from "../services/rose.service";

type RangeMode = "realtime" | "1h" | "1d";
const RANGE_HOURS: Record<Exclude<RangeMode, "realtime">, number> = {
  "1h": 1,
  "1d": 24,
};

const parseRange = (raw: unknown): RangeMode => {
  if (raw === "1h" || raw === "1d") return raw;
  return "realtime";
};

/**
 * Live Data Cache using Redis
 * Generator scripts write via POST endpoints, GET endpoints read from Redis
 * Data auto-expires after 5 minutes (300s TTL) if generator stops pushing
 */

const WIND_ROSE_TTL = 300; // 5 minutes
const POLLUTION_ROSE_TTL = 300; // 5 minutes
const REALTIME_PARAMS_TTL = 30; // 30 seconds (updates every 5-10s from MQTT)

/**
 * Get latest wind rose data
 * GET /api/live/wind-rose
 * Returns data from Redis (populated by generator script)
 */
export const getWindRose = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { deviceId } = req.query;
    const range = parseRange(req.query.range);

    if (!deviceId) {
      res.status(400).json({
        success: false,
        error: "deviceId is required",
      });
      return;
    }

    // Realtime: read the 10-minute MQTT-accumulated snapshot from Redis
    if (range === "realtime") {
      if (!redis.isRedisAvailable()) {
        res.status(503).json({
          success: false,
          error: "Cache service unavailable",
        });
        return;
      }

      const key = `live:windrose:${deviceId}`;
      const cached = await redis.get(key);

      if (!cached) {
        res.status(404).json({
          success: false,
          error: "No live data available",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: JSON.parse(cached),
      });
      return;
    }

    // 1h / 1d: build histogram from telemetry_processed
    const histogram = await getWindRoseHistogram(
      deviceId as string,
      RANGE_HOURS[range],
    );

    if (histogram.count === 0) {
      res.status(404).json({
        success: false,
        error: "No telemetry data in selected range",
      });
      return;
    }

    res.status(200).json({ success: true, data: histogram });
  } catch (error) {
    next(error);
  }
};

/**
 * Get latest pollution rose data
 * GET /api/live/pollution-rose
 * Returns data from Redis (populated by generator script)
 */
export const getPollutionRose = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { deviceId, parameter = "SO2" } = req.query;
    const range = parseRange(req.query.range);

    if (!deviceId) {
      res.status(400).json({
        success: false,
        error: "deviceId is required",
      });
      return;
    }

    if (range === "realtime") {
      if (!redis.isRedisAvailable()) {
        res.status(503).json({
          success: false,
          error: "Cache service unavailable",
        });
        return;
      }

      const key = `live:pollutionrose:${deviceId}:${(parameter as string).toUpperCase()}`;
      const cached = await redis.get(key);

      if (!cached) {
        res.status(404).json({
          success: false,
          error: "No live data available.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: JSON.parse(cached),
      });
      return;
    }

    const histogram = await getPollutionRoseHistogram(
      deviceId as string,
      parameter as string,
      RANGE_HOURS[range],
    );

    if (histogram.count === 0) {
      res.status(404).json({
        success: false,
        error: "No telemetry data in selected range",
      });
      return;
    }

    res.status(200).json({ success: true, data: histogram });
  } catch (error) {
    next(error);
  }
};

/**
 * Update wind rose data (called by generator script)
 * POST /api/live/wind-rose/update
 * Stores in Redis with 5-minute TTL
 */
export const updateWindRose = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { deviceId, timestamp, directions } = req.body;

    if (!deviceId || !directions) {
      res.status(400).json({
        success: false,
        error: "deviceId and directions are required",
      });
      return;
    }

    const data = {
      timestamp: timestamp || new Date().toISOString(),
      deviceId,
      directions,
    };

    // Store in Redis with TTL
    const key = `live:windrose:${deviceId}`;
    const stored = await redis.setWithTTL(key, JSON.stringify(data), WIND_ROSE_TTL);

    if (!stored) {
      res.status(503).json({
        success: false,
        error: "Failed to store data — cache service unavailable",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Wind rose data updated",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update pollution rose data (called by generator script)
 * POST /api/live/pollution-rose/update
 * Stores in Redis with 5-minute TTL
 */
export const updatePollutionRose = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { deviceId, parameter, timestamp, directions } = req.body;

    if (!deviceId || !parameter || !directions) {
      res.status(400).json({
        success: false,
        error: "deviceId, parameter, and directions are required",
      });
      return;
    }

    const data = {
      timestamp: timestamp || new Date().toISOString(),
      deviceId,
      parameter: parameter.toUpperCase(),
      directions,
    };

    // Store in Redis with TTL (key includes parameter)
    const key = `live:pollutionrose:${deviceId}:${parameter.toUpperCase()}`;
    const stored = await redis.setWithTTL(key, JSON.stringify(data), POLLUTION_ROSE_TTL);

    if (!stored) {
      res.status(503).json({
        success: false,
        error: "Failed to store data — cache service unavailable",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Pollution rose data updated",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get latest real-time parameter readings
 * GET /api/live/realtime-params
 * Returns the most recent sensor readings from Redis (pushed by MQTT subscriber)
 */
export const getRealtimeParams = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      res.status(400).json({
        success: false,
        error: "deviceId is required",
      });
      return;
    }

    if (!redis.isRedisAvailable()) {
      res.status(503).json({
        success: false,
        error: "Cache service unavailable",
      });
      return;
    }

    const key = `live:realtime:${deviceId}`;
    const cached = await redis.get(key);

    if (!cached) {
      res.status(404).json({
        success: false,
        error: "No live data available",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: JSON.parse(cached),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update real-time parameter readings (called by MQTT subscriber)
 * POST /api/live/realtime-params/update
 * Stores latest readings in Redis with 30s TTL
 */
export const updateRealtimeParams = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { deviceId, timestamp, readings } = req.body;

    if (!deviceId || !readings) {
      res.status(400).json({
        success: false,
        error: "deviceId and readings are required",
      });
      return;
    }

    const data = {
      timestamp: timestamp || new Date().toISOString(),
      deviceId,
      readings,
    };

    const key = `live:realtime:${deviceId}`;
    const stored = await redis.setWithTTL(key, JSON.stringify(data), REALTIME_PARAMS_TTL);

    if (!stored) {
      res.status(503).json({
        success: false,
        error: "Failed to store data — cache service unavailable",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Realtime params updated",
    });
  } catch (error) {
    next(error);
  }
};
