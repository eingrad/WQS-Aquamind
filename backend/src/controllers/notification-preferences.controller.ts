import { Request, Response } from "express";
import prisma from "../config/database";
import { sendTelegramNotification } from "../services/notification.service";

/**
 * Get notification preferences for the current user
 */
export const getNotificationPreferences = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let preferences = await prisma.userNotificationPreference.findUnique({
      where: { userId },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await prisma.userNotificationPreference.create({
        data: {
          userId,
          notifyInApp: true,
          notifyEmail: false,
          notifyTelegram: false,
        },
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ error: "Failed to fetch notification preferences" });
  }
};

/**
 * Update notification preferences for the current user
 */
export const updateNotificationPreferences = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      notifyInApp,
      notifyEmail,
      notifyTelegram,
      emailAddress,
      telegramChatId,
    } = req.body;

    const preferences = await prisma.userNotificationPreference.upsert({
      where: { userId },
      update: {
        notifyInApp,
        notifyEmail,
        notifyTelegram,
        emailAddress,
        telegramChatId,
      },
      create: {
        userId,
        notifyInApp: notifyInApp ?? true,
        notifyEmail: notifyEmail ?? false,
        notifyTelegram: notifyTelegram ?? false,
        emailAddress,
        telegramChatId,
      },
    });

    res.json({ success: true, preferences });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res
      .status(500)
      .json({ error: "Failed to update notification preferences" });
  }
};

/**
 * Test Telegram notification for the current user
 */
export const testTelegramNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const username = req.user?.username || "User";

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { telegramChatId } = req.body;

    if (!telegramChatId) {
      return res.status(400).json({ error: "Telegram Chat ID is required" });
    }

    const testMessage = `
🔔 *Test Notification*

Hello ${username}! This is a test notification from Air Quality Monitoring System Pengerang.

If you received this message, your Telegram notifications are configured correctly! ✅
    `.trim();

    const result = await sendTelegramNotification(telegramChatId, testMessage);

    if (result.sent) {
      res.json({
        success: true,
        message: "Test notification sent successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || "Failed to send test notification",
      });
    }
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ error: "Failed to send test notification" });
  }
};
