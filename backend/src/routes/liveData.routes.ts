import { Router } from "express";
import * as liveDataController from "../controllers/liveData.controller";
import { authenticate, requireInternalSecret } from "../middleware/auth";

const router = Router();

/**
 * @route   GET /api/live/realtime-params
 * @desc    Get latest real-time sensor readings (pushed by MQTT every minute)
 * @access  Private (JWT)
 * @query   deviceId - Device UUID
 */
router.get("/realtime-params", authenticate, liveDataController.getRealtimeParams);

/**
 * @route   POST /api/live/realtime-params/update
 * @desc    Update real-time sensor readings (called internally by MQTT subscriber)
 * @access  Internal only — requires X-Internal-Secret header
 * @body    { deviceId, timestamp, readings }
 */
router.post(
  "/realtime-params/update",
  requireInternalSecret,
  liveDataController.updateRealtimeParams,
);

export default router;
