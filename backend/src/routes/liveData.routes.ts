import { Router } from "express";
import * as liveDataController from "../controllers/liveData.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// All live data routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/live/wind-rose
 * @desc    Get current wind rose data (10s updates)
 * @access  Private
 * @query   deviceId - Device UUID
 */
router.get("/wind-rose", liveDataController.getWindRose);

/**
 * @route   GET /api/live/pollution-rose
 * @desc    Get current pollution rose data (10s updates)
 * @access  Private
 * @query   deviceId - Device UUID
 * @query   parameter - Pollutant (SO2, H2S, NO2, BTEX)
 */
router.get("/pollution-rose", liveDataController.getPollutionRose);

/**
 * @route   POST /api/live/wind-rose/update
 * @desc    Update wind rose data (called by generator script)
 * @access  Private
 * @body    { deviceId, timestamp, directions }
 */
router.post("/wind-rose/update", liveDataController.updateWindRose);

/**
 * @route   POST /api/live/pollution-rose/update
 * @desc    Update pollution rose data (called by generator script)
 * @access  Private
 * @body    { deviceId, parameter, timestamp, directions }
 */
router.post("/pollution-rose/update", liveDataController.updatePollutionRose);

export default router;
