import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users (paginated)
 * @access  Admin only
 */
router.get("/", authorize(["admin"]), userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (own profile) or Admin
 */
router.get("/:id", userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Admin only
 */
router.put("/:id", authorize(["admin"]), userController.updateUser);

/**
 * @route   PUT /api/users/:id/password
 * @desc    Change user password
 * @access  Private (own password) or Admin
 */
router.put("/:id/password", userController.changePassword);

/**
 * @route   DELETE /api/users/:id
 * @desc    Soft delete user
 * @access  Admin only
 */
router.delete("/:id", authorize(["admin"]), userController.deleteUser);

/**
 * @route   DELETE /api/users/:id/hard
 * @desc    Permanently delete user
 * @access  Admin only
 */
router.delete("/:id/hard", authorize(["admin"]), userController.hardDeleteUser);

export default router;
