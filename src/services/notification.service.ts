import api from "./api";

// Types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  severity?: "info" | "warning" | "critical" | "emergency";
  alertHistoryId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  alertHistory?: {
    id: string;
    parameter: string;
    actualValue: number;
    thresholdValue: number;
    thresholdType: string;
    device: {
      deviceCode: string;
      name: string;
    };
  };
}

/**
 * Get user's notifications
 */
export const getNotifications = async (unreadOnly = false) => {
  const params = unreadOnly ? "?unreadOnly=true" : "";
  const response = await api.get(`/alerts/notifications${params}`);
  return response.data.data as Notification[];
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
  const response = await api.get("/alerts/notifications/unread-count");
  return response.data.count as number;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (id: string) => {
  const response = await api.patch(`/alerts/notifications/${id}/read`);
  return response.data.data as Notification;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  const response = await api.patch("/alerts/notifications/read-all");
  return response.data;
};

/**
 * Delete notification
 */
export const deleteNotification = async (id: string) => {
  const response = await api.delete(`/alerts/notifications/${id}`);
  return response.data;
};
