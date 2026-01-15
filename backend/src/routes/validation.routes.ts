import { Router } from "express";
import * as validationController from "../controllers/validation.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// All validation routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/validation/table-data
 * @desc    Get 1-minute data for validation table (QA/QC workflow)
 * @access  Private
 * @query   deviceId, startDate, endDate, page, limit
 */
router.get("/table-data", validationController.getValidationTableData);

export default router;
