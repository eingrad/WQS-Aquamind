import { Router } from "express";
import * as validationController from "../controllers/validation.controller";
import * as approvalController from "../controllers/approval.controller";
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

/**
 * @route   POST /api/validation/request-flag
 * @desc    QC user submits flag request for admin approval
 * @access  Private (QC users)
 */
router.post("/request-flag", approvalController.requestFlag);

/**
 * @route   GET /api/validation/pending-approvals
 * @desc    Admin views pending flag approval requests
 * @access  Private (Admin only)
 */
router.get("/pending-approvals", approvalController.getPendingApprovals);

/**
 * @route   GET /api/validation/all-approvals
 * @desc    Admin views all flag approval requests (with optional status filter)
 * @access  Private (Admin only)
 * @query   status (optional): 'all', 'pending', 'approved', 'rejected'
 */
router.get("/all-approvals", approvalController.getAllApprovals);

/**
 * @route   GET /api/validation/my-requests
 * @desc    User views their own flag requests
 * @access  Private
 */
router.get("/my-requests", approvalController.getMyRequests);

/**
 * @route   POST /api/validation/approve-flag
 * @desc    Admin approves a flag request
 * @access  Private (Admin only)
 */
router.post("/approve-flag", approvalController.approveFlag);

/**
 * @route   POST /api/validation/reject-flag
 * @desc    Admin rejects a flag request
 * @access  Private (Admin only)
 */
router.post("/reject-flag", approvalController.rejectFlag);

export default router;
