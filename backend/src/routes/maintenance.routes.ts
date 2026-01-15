import { Router } from "express";
import * as maintenanceController from "../controllers/maintenance.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Device-specific maintenance routes
 */
router.post(
  "/devices/:deviceId/maintenance",
  maintenanceController.createMaintenance
);

router.get(
  "/devices/:deviceId/maintenance",
  maintenanceController.getMaintenanceLogs
);

router.get(
  "/devices/:deviceId/maintenance/active",
  maintenanceController.getActiveMaintenance
);

/**
 * Maintenance log-specific routes
 */
router.patch("/maintenance/:logId/end", maintenanceController.endMaintenance);

router.delete("/maintenance/:logId", maintenanceController.deleteMaintenance);

export default router;
