import { Router } from "express";
import * as thresholdController from "../controllers/alert-threshold.controller";
import * as historyController from "../controllers/alert-history.controller";
import * as notificationController from "../controllers/notification.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// ========================================
// THRESHOLD MANAGEMENT (Admin Only)
// ========================================
router.get(
  "/thresholds",
  authenticate,
  authorize(["admin"]),
  thresholdController.getThresholds,
);

router.get(
  "/thresholds/:id",
  authenticate,
  authorize(["admin"]),
  thresholdController.getThresholdById,
);

router.post(
  "/thresholds",
  authenticate,
  authorize(["admin"]),
  thresholdController.createThreshold,
);

router.put(
  "/thresholds/:id",
  authenticate,
  authorize(["admin"]),
  thresholdController.updateThreshold,
);

router.delete(
  "/thresholds/:id",
  authenticate,
  authorize(["admin"]),
  thresholdController.deleteThreshold,
);

router.patch(
  "/thresholds/:id/toggle",
  authenticate,
  authorize(["admin"]),
  thresholdController.toggleThreshold,
);

// ========================================
// ALERT HISTORY (All Authenticated Users)
// ========================================
router.get("/history", authenticate, historyController.getAlertHistory);

router.get("/history/:id", authenticate, historyController.getAlertById);

router.patch(
  "/history/:id/acknowledge",
  authenticate,
  historyController.acknowledgeAlert,
);

// ========================================
// NOTIFICATIONS (Per User)
// ========================================
router.get(
  "/notifications",
  authenticate,
  notificationController.getNotifications,
);

router.get(
  "/notifications/unread-count",
  authenticate,
  notificationController.getUnreadCount,
);

router.patch(
  "/notifications/:id/read",
  authenticate,
  notificationController.markAsRead,
);

router.patch(
  "/notifications/read-all",
  authenticate,
  notificationController.markAllAsRead,
);

router.delete(
  "/notifications/:id",
  authenticate,
  notificationController.deleteNotification,
);

export default router;
