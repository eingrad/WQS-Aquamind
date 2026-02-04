import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  severity?: "info" | "warning" | "critical" | "emergency";
  alertHistoryId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

/**
 * Send in-app notification (create in database)
 */
export const sendInAppNotification = async (data: NotificationData) => {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      severity: data.severity,
      alertHistoryId: data.alertHistoryId,
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,
      isRead: false,
    },
  });

  return notification;
};

/**
 * Send email notification
 * TODO: Implement email sending with NodeMailer
 */
export const sendEmailNotification = async (
  email: string,
  subject: string,
  body: string,
  html?: string,
) => {
  // Placeholder for email service integration
  console.log(`📧 Email notification queued to ${email}: ${subject}`);

  // TODO: Implement with NodeMailer
  /*
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "PETRONAS Monitoring <noreply@petronas.com>",
    to: email,
    subject,
    text: body,
    html: html || body,
  });
  */

  return { sent: true, email, subject };
};

/**
 * Send Telegram notification
 * TODO: Implement Telegram Bot API integration
 */
export const sendTelegramNotification = async (
  chatId: string,
  message: string,
) => {
  // Placeholder for Telegram Bot integration
  console.log(`💬 Telegram notification queued to chat ${chatId}: ${message}`);

  // TODO: Implement with Telegram Bot API
  /*
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  });
  */

  return { sent: true, chatId };
};

/**
 * Send multi-channel notification based on alert history
 * Sends to all users with enabled notification preferences
 */
export const sendMultiChannelNotification = async (alertHistory: any) => {
  const {
    device,
    parameter,
    actualValue,
    thresholdValue,
    thresholdType,
    observedAt,
  } = alertHistory;

  // Get all users with notification preferences
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    include: {
      notificationPreference: true,
    },
  });

  const severityMap: Record<
    string,
    "info" | "warning" | "critical" | "emergency"
  > = {
    warning: "warning",
    critical: "critical",
    emergency: "emergency",
  };

  const severity = severityMap[thresholdType] || "warning";

  // Emoji mapping for severity
  const severityEmoji: Record<string, string> = {
    warning: "⚠️",
    critical: "🚨",
    emergency: "🔴",
  };

  const emoji = severityEmoji[severity] || "⚠️";

  // Format timestamp
  const timestamp = new Date(observedAt).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const title = `${emoji} ${thresholdType.toUpperCase()} Alert: ${parameter.toUpperCase()}`;
  const message = `Device: ${device.name} (${device.location})\nParameter: ${parameter.toUpperCase()}\nValue: ${actualValue}\nThreshold: ${thresholdValue}\nTime: ${timestamp}`;

  const results = {
    inApp: 0,
    email: 0,
    telegram: 0,
  };

  for (const user of users) {
    const prefs = user.notificationPreference;

    // Send in-app notification (default enabled)
    if (!prefs || prefs.notifyInApp) {
      await sendInAppNotification({
        userId: user.id,
        type: "alert",
        title,
        message,
        severity,
        alertHistoryId: alertHistory.id,
        relatedEntityType: "ALERT_HISTORY",
        relatedEntityId: alertHistory.id,
      });
      results.inApp++;
    }

    // Send email if enabled and email address is set
    if (prefs?.notifyEmail && prefs.emailAddress) {
      const emailHtml = formatEmailHtml(alertHistory, device, severity);
      await sendEmailNotification(
        prefs.emailAddress,
        title,
        message,
        emailHtml,
      );
      results.email++;
    }

    // Send Telegram if enabled and chatId is set
    if (prefs?.notifyTelegram && prefs.telegramChatId) {
      const telegramMessage = formatTelegramMessage(
        alertHistory,
        device,
        severity,
      );
      await sendTelegramNotification(prefs.telegramChatId, telegramMessage);
      results.telegram++;
    }
  }

  console.log(
    `📤 Multi-channel notification sent: ${results.inApp} in-app, ${results.email} email, ${results.telegram} Telegram`,
  );

  return results;
};

/**
 * Get unread notifications for a user
 */
export const getUnreadNotifications = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    include: {
      alertHistory: {
        include: {
          device: {
            select: {
              deviceCode: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return notifications;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return count;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string) => {
  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return notification;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { success: true };
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string) => {
  await prisma.notification.delete({
    where: { id: notificationId },
  });

  return { deleted: true };
};

/**
 * Format email HTML content
 */
function formatEmailHtml(
  alertHistory: any,
  device: any,
  severity: string,
): string {
  const severityColors: Record<string, string> = {
    warning: "#f59e0b",
    critical: "#ef4444",
    emergency: "#dc2626",
  };

  const color = severityColors[severity] || "#f59e0b";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .detail { margin: 10px 0; padding: 10px; background-color: white; border-left: 4px solid ${color}; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${alertHistory.thresholdType.toUpperCase()} Alert</h2>
            <p>${alertHistory.parameter.toUpperCase()} Threshold Exceeded</p>
          </div>
          <div class="content">
            <div class="detail">
              <strong>Device:</strong> ${device.name}<br>
              <strong>Location:</strong> ${device.location}<br>
              <strong>Parameter:</strong> ${alertHistory.parameter.toUpperCase()}<br>
              <strong>Current Value:</strong> ${alertHistory.actualValue}<br>
              <strong>Threshold:</strong> ${alertHistory.thresholdValue}<br>
              <strong>Time:</strong> ${new Date(alertHistory.observedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}
            </div>
            <p>Please review this alert in the monitoring dashboard.</p>
          </div>
          <div class="footer">
            <p>PETRONAS Monitoring System - Automated Alert Notification</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Format Telegram message with Markdown
 */
function formatTelegramMessage(
  alertHistory: any,
  device: any,
  severity: string,
): string {
  const severityEmoji: Record<string, string> = {
    warning: "⚠️",
    critical: "🚨",
    emergency: "🔴",
  };

  const emoji = severityEmoji[severity] || "⚠️";

  return `
${emoji} *${alertHistory.thresholdType.toUpperCase()} ALERT*

*Device:* ${device.name}
*Location:* ${device.location}
*Parameter:* ${alertHistory.parameter.toUpperCase()}
*Current Value:* ${alertHistory.actualValue}
*Threshold:* ${alertHistory.thresholdValue}
*Time:* ${new Date(alertHistory.observedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}

Please check the dashboard for details.
  `.trim();
}

export default {
  sendInAppNotification,
  sendEmailNotification,
  sendTelegramNotification,
  sendMultiChannelNotification,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
