import { Request, Response } from "express";
import * as calibrationService from "../services/calibration.service";
import redis from "../services/redis.service";

/**
 * GET /api/calibration?deviceId=...
 * Returns calibration (slope/offset) for every calibratable parameter of a
 * device, with 1/0 defaults for parameters that were never calibrated.
 */
export const getCalibration = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.query;
    if (!deviceId || typeof deviceId !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "deviceId is required" });
    }

    const data = await calibrationService.getDeviceCalibration(deviceId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to load calibration",
      details: error.message,
    });
  }
};

/**
 * PUT /api/calibration
 * Body: { deviceId, parameter, slope, offset }
 * Upserts one parameter's calibration, then clears that device's live cache so
 * the corrected value shows immediately rather than after the next message.
 */
export const updateCalibration = async (req: Request, res: Response) => {
  try {
    const { deviceId, parameter, operation, value } = req.body ?? {};

    if (!deviceId || !parameter || !operation) {
      return res.status(400).json({
        success: false,
        error: "deviceId, parameter and operation are required",
      });
    }

    const saved = await calibrationService.upsertCalibration({
      deviceId,
      parameter,
      operation: String(operation),
      value: Number(value),
      userId: req.user?.userId,
    });

    // Instant effect: drop the stale realtime snapshot for this device.
    await redis.del(`live:realtime:${deviceId}`);

    res.status(200).json({
      success: true,
      data: saved,
      message: "Calibration updated",
    });
  } catch (error: any) {
    // Validation errors from the service → 400
    if (/^(Unknown parameter|Unknown operation|Value must)/.test(error.message ?? "")) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({
      success: false,
      error: "Failed to update calibration",
      details: error.message,
    });
  }
};

export default { getCalibration, updateCalibration };
