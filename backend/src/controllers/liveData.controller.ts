import { Request, Response, NextFunction } from "express";
import redis from "../services/redis.service";

const REALTIME_PARAMS_TTL = 90; // 90 seconds — matches MQTT 1-minute cadence with buffer

/**
 * GET /api/live/realtime-params
 * Returns the most recent sensor readings pushed by the MQTT subscriber.
 */
export const getRealtimeParams = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      res.status(400).json({ success: false, error: "deviceId is required" });
      return;
    }

    if (!redis.isRedisAvailable()) {
      res.status(503).json({ success: false, error: "Cache service unavailable" });
      return;
    }

    const key = `live:realtime:${deviceId}`;
    const cached = await redis.get(key);

    if (!cached) {
      res.status(404).json({ success: false, error: "No live data available" });
      return;
    }

    res.status(200).json({ success: true, data: JSON.parse(cached) });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/live/realtime-params/update
 * Stores latest readings in Redis (called by internal MQTT subscriber path).
 */
export const updateRealtimeParams = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { deviceId, timestamp, readings } = req.body;

    if (!deviceId || !readings) {
      res.status(400).json({ success: false, error: "deviceId and readings are required" });
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
      res.status(503).json({ success: false, error: "Failed to store data — cache service unavailable" });
      return;
    }

    res.status(200).json({ success: true, message: "Realtime params updated" });
  } catch (error) {
    next(error);
  }
};

export default { getRealtimeParams, updateRealtimeParams };
