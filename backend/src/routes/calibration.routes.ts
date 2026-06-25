import { Router } from "express";
import * as calibrationController from "../controllers/calibration.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// All calibration routes require authentication.
router.use(authenticate);

// Read calibration — admin + technician (those who manage devices).
router.get(
  "/",
  authorize(["admin", "technician"]),
  calibrationController.getCalibration,
);

// Update a parameter's calibration — admin + technician.
router.put(
  "/",
  authorize(["admin", "technician"]),
  calibrationController.updateCalibration,
);

export default router;
