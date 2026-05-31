import { Router } from "express";
import * as telemetryController from "../controllers/telemetry.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// All telemetry routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/sensors/readings/latest
 * @desc    Get latest sensor readings
 * @access  Private
 */
router.get("/readings/latest", telemetryController.getLatestReadings);

/**
 * @route   POST /api/sensors/readings/bulk
 * @desc    Create multiple sensor readings
 * @access  Technician or Admin
 */
router.post(
  "/readings/bulk",
  authorize(["technician", "admin"]),
  telemetryController.createReadingsBulk
);

/**
 * @route   GET /api/sensors/readings
 * @desc    Get sensor readings (filtered, paginated)
 * @access  Private
 */
router.get("/readings", telemetryController.getReadings);

/**
 * @route   POST /api/sensors/readings
 * @desc    Create a new sensor reading
 * @access  Technician or Admin
 */
router.post(
  "/readings",
  authorize(["technician", "admin"]),
  telemetryController.createReading
);

/**
 * @route   GET /api/sensors/readings/time-series
 * @desc    Get time-series aggregated data for charts
 * @access  Private
 */
router.get("/readings/time-series", telemetryController.getTimeSeries);

/**
 * @route   GET /api/sensors/device-status
 * @desc    Check if device is currently active (sent data in last 3 hours)
 * @access  Private
 */
router.get("/device-status", telemetryController.getDeviceStatus);

/**
 * @route   GET /api/sensors/hourly-avg
 * @desc    Get hourly averages for a specific parameter
 * @access  Private
 */
router.get("/hourly-avg", telemetryController.getHourlyAverages);

/**
 * @route   GET /api/sensors/readings/:id
 * @desc    Get sensor reading by ID
 * @access  Private
 */
router.get("/readings/:id", telemetryController.getReadingById);

export default router;
