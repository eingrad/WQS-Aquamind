import { Router } from "express";
import * as deviceController from "../controllers/device.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// All device routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/devices/stats
 * @desc    Get device statistics
 * @access  Private
 */
router.get("/stats", deviceController.getDeviceStats);

/**
 * @route   GET /api/devices
 * @desc    Get all devices (paginated, filtered)
 * @access  Private
 */
router.get("/", deviceController.getAllDevices);

/**
 * @route   GET /api/devices/:id
 * @desc    Get device by ID
 * @access  Private
 */
router.get("/:id", deviceController.getDeviceById);

/**
 * @route   POST /api/devices
 * @desc    Create new device
 * @access  Admin only
 */
router.post("/", authorize(["admin"]), deviceController.createDevice);

/**
 * @route   PUT /api/devices/:id
 * @desc    Update device
 * @access  Admin only
 */
router.put("/:id", authorize(["admin"]), deviceController.updateDevice);

/**
 * @route   DELETE /api/devices/:id
 * @desc    Delete device
 * @access  Admin only
 */
router.delete("/:id", authorize(["admin"]), deviceController.deleteDevice);

export default router;
