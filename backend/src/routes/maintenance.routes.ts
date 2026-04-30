import { Router } from "express";
import * as maintenanceController from "../controllers/maintenance.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Cross-device list (admin + technician)
 */
router.get(
  "/maintenance",
  authorize(["admin", "technician"]),
  maintenanceController.getAllMaintenance
);

/**
 * Device-specific maintenance routes
 */
router.post(
  "/devices/:deviceId/maintenance",
  authorize(["admin", "technician"]),
  maintenanceController.createMaintenance
);

router.get(
  "/devices/:deviceId/maintenance",
  authorize(["admin", "technician"]),
  maintenanceController.getMaintenanceLogs
);

router.get(
  "/devices/:deviceId/maintenance/active",
  authorize(["admin", "technician"]),
  maintenanceController.getActiveMaintenance
);

/**
 * Maintenance log-specific routes
 */
router.patch(
  "/maintenance/:logId/end",
  authorize(["admin", "technician"]),
  maintenanceController.endMaintenance
);

router.delete(
  "/maintenance/:logId",
  authorize(["admin", "technician"]),
  maintenanceController.deleteMaintenance
);

export default router;
