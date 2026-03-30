import { Request, Response } from "express";
import * as notificationService from "../services/notification.service";

/**
 * Get user's notifications
 * GET /api/alerts/notifications
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId; // Fixed: was .id, should be .userId
    const { unreadOnly } = req.query;

    let notifications;

    if (unreadOnly === "true") {
      notifications = await notificationService.getUnreadNotifications(userId);
    } else {
      notifications = await notificationService.getAllNotifications(userId);
    }

    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

/**
 * Get unread notification count
 * GET /api/alerts/notifications/unread-count
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};

/**
 * Mark notification as read
 * PATCH /api/alerts/notifications/:id/read
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const notification = await notificationService.markAsRead(id, userId);

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/alerts/notifications/read-all
 */
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error: any) {
    console.error("Error marking all as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all as read",
      error: error.message,
    });
  }
};

/**
 * Delete notification
 * DELETE /api/alerts/notifications/:id
 */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    await notificationService.deleteNotification(id, userId);

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
