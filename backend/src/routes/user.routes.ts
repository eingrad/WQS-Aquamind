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

// ============================================================================
// /me routes MUST come BEFORE /:id routes, otherwise Express treats "me" as an ID
// ============================================================================

/**
 * @route   GET /api/users/me/notification-preferences
 * @desc    Get notification preferences for current user
 * @access  Private
 */
router.get("/me/notification-preferences", async (req, res) => {
  const { getNotificationPreferences } =
    await import("../controllers/notification-preferences.controller");
  return getNotificationPreferences(req, res);
});

/**
 * @route   PUT /api/users/me/notification-preferences
 * @desc    Update notification preferences for current user
 * @access  Private
 */
router.put("/me/notification-preferences", async (req, res) => {
  const { updateNotificationPreferences } =
    await import("../controllers/notification-preferences.controller");
  return updateNotificationPreferences(req, res);
});

/**
 * @route   POST /api/users/me/test-telegram
 * @desc    Test Telegram notification for current user
 * @access  Private
 */
router.post("/me/test-telegram", async (req, res) => {
  const { testTelegramNotification } =
    await import("../controllers/notification-preferences.controller");
  return testTelegramNotification(req, res);
});

// ============================================================================
// /:id routes (parameterized) — must come AFTER specific /me routes
// ============================================================================

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
