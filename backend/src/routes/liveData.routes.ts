import { Router } from "express";
import * as liveDataController from "../controllers/liveData.controller";
import { authenticate, requireInternalSecret } from "../middleware/auth";

const router = Router();

/**
 * @route   GET /api/live/wind-rose
 * @desc    Get current wind rose data (10s updates)
 * @access  Private (JWT)
 * @query   deviceId - Device UUID
 */
router.get("/wind-rose", authenticate, liveDataController.getWindRose);

/**
 * @route   GET /api/live/pollution-rose
 * @desc    Get current pollution rose data (10s updates)
 * @access  Private (JWT)
 * @query   deviceId - Device UUID
 * @query   parameter - Pollutant (SO2, H2S, NO2, BTEX)
 */
router.get("/pollution-rose", authenticate, liveDataController.getPollutionRose);

/**
 * @route   POST /api/live/wind-rose/update
 * @desc    Update wind rose data (called by MQTT/generator script)
 * @access  Internal only — requires X-Internal-Secret header
 * @body    { deviceId, timestamp, directions }
 */
router.post(
  "/wind-rose/update",
  requireInternalSecret,
  liveDataController.updateWindRose,
);

/**
 * @route   POST /api/live/pollution-rose/update
 * @desc    Update pollution rose data (called by MQTT/generator script)
 * @access  Internal only — requires X-Internal-Secret header
 * @body    { deviceId, parameter, timestamp, directions }
 */
router.post(
  "/pollution-rose/update",
  requireInternalSecret,
  liveDataController.updatePollutionRose,
);

/**
 * @route   GET /api/live/realtime-params
 * @desc    Get latest real-time sensor readings (5-10s updates via MQTT)
 * @access  Private (JWT)
 * @query   deviceId - Device UUID
 */
router.get("/realtime-params", authenticate, liveDataController.getRealtimeParams);

/**
 * @route   POST /api/live/realtime-params/update
 * @desc    Update real-time sensor readings (called by MQTT subscriber)
 * @access  Internal only — requires X-Internal-Secret header
 * @body    { deviceId, timestamp, readings }
 */
router.post(
  "/realtime-params/update",
  requireInternalSecret,
  liveDataController.updateRealtimeParams,
);

export default router;
