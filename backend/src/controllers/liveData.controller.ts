import { Request, Response, NextFunction } from "express";

/**
 * In-Memory Cache for Live Data
 * Generator scripts write here, GET endpoints read from here
 * TODO: Replace with Redis when available
 */
const liveDataCache: {
  windRose: Map<string, any>;
  pollutionRose: Map<string, any>;
} = {
  windRose: new Map(),
  pollutionRose: new Map(),
};

/**
 * Get latest wind rose data
 * GET /api/live/wind-rose
 * Returns data from generator script only (no fallback)
 */
export const getWindRose = async (
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

    // Get from cache (populated by generator script)
    const data = liveDataCache.windRose.get(deviceId as string);

    if (!data) {
      res.status(404).json({
        success: false,
        error: "No live data available",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get latest pollution rose data
 * GET /api/live/pollution-rose
 * Returns data from generator script only (no fallback)
 */
export const getPollutionRose = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { deviceId, parameter = "SO2" } = req.query;

    if (!deviceId) {
      res.status(400).json({
        success: false,
        error: "deviceId is required",
      });
      return;
    }

    // Get from cache (populated by generator script)
    const cacheKey = `${deviceId}:${parameter}`;
    const data = liveDataCache.pollutionRose.get(cacheKey);

    if (!data) {
      res.status(404).json({
        success: false,
        error: "No live data available.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update wind rose data (called by generator script)
 * POST /api/live/wind-rose/update
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

    // Store in cache
    liveDataCache.windRose.set(deviceId, {
      timestamp: timestamp || new Date().toISOString(),
      deviceId,
      directions,
    });

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

    // Store in cache (key includes parameter)
    const cacheKey = `${deviceId}:${parameter}`;
    liveDataCache.pollutionRose.set(cacheKey, {
      timestamp: timestamp || new Date().toISOString(),
      deviceId,
      parameter: parameter.toUpperCase(),
      directions,
    });

    res.status(200).json({
      success: true,
      message: "Pollution rose data updated",
    });
  } catch (error) {
    next(error);
  }
};
