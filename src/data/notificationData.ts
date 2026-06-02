// Notification types
export type NotificationType = "approval" | "validation" | "flag" | "system";
export type NotificationPriority = "high" | "medium" | "low";

// Notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
}

// Notification type labels and colors
export const notificationTypeColors: Record<NotificationType, string> = {
  approval: "border-blue-500",
  validation: "border-blue-500",
  flag: "border-amber-500",
  system: "border-gray-500",
};

export const notificationTypeBgColors: Record<NotificationType, string> = {
  approval: "bg-blue-500/10",
  validation: "bg-blue-500/10",
  flag: "bg-amber-500/10",
  system: "bg-gray-500/10",
};

export const notificationTypeLabels: Record<NotificationType, string> = {
  approval: "Approval",
  validation: "Validation",
  flag: "Flag",
  system: "System",
};

// Priority colors
export const priorityColors: Record<NotificationPriority, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

// Sample notifications data
export let notifications: Notification[] = [
  {
    id: "notif-1",
    type: "approval",
    title: "New Approval Request",
    message: "H₂S value flagged as Out of Range requires approval",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    isRead: false,
    priority: "high",
    actionUrl: "/data-approval",
  },
  {
    id: "notif-2",
    type: "approval",
    title: "Value Change Pending",
    message: "User1 requested approval for corrected SO₂ value",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    isRead: false,
    priority: "medium",
    actionUrl: "/data-approval",
  },
  {
    id: "notif-3",
    type: "validation",
    title: "Data Validated",
    message: "Temperature sensor data has been validated successfully",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    isRead: false,
    priority: "low",
    actionUrl: "/data-validation",
  },
  {
    id: "notif-4",
    type: "flag",
    title: "Data Flagged",
    message: "NO₂ readings flagged as Insufficient Data",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    isRead: false,
    priority: "medium",
    actionUrl: "/data-validation",
  },
  {
    id: "notif-5",
    type: "system",
    title: "Sensor Calibration Due",
    message: "Wind Speed sensor requires calibration within 24 hours",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isRead: true,
    priority: "high",
    actionUrl: "/dashboard",
  },
  {
    id: "notif-6",
    type: "approval",
    title: "Multiple Approvals Pending",
    message: "3 validation requests waiting for admin approval",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    isRead: true,
    priority: "high",
    actionUrl: "/data-approval",
  },
  {
    id: "notif-7",
    type: "flag",
    title: "QC Check Failed",
    message: "Wind Direction failed QC checks - review required",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    isRead: true,
    priority: "medium",
    actionUrl: "/data-validation",
  },
  {
    id: "notif-8",
    type: "validation",
    title: "Bulk Validation Complete",
    message: "10 data points validated for BTEX analyzer",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    isRead: true,
    priority: "low",
    actionUrl: "/data-validation",
  },
  {
    id: "notif-9",
    type: "system",
    title: "Data Export Ready",
    message: "Monthly report data export is ready for download",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    isRead: true,
    priority: "low",
    actionUrl: "/reports",
  },
  {
    id: "notif-10",
    type: "approval",
    title: "Approval Request Updated",
    message: "Humidity sensor value change request has been modified",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    isRead: true,
    priority: "medium",
    actionUrl: "/data-approval",
  },
  {
    id: "notif-11",
    type: "system",
    title: "System Maintenance",
    message: "Scheduled maintenance window from 2:00 AM - 4:00 AM",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    isRead: true,
    priority: "medium",
    actionUrl: "/settings",
  },
  {
    id: "notif-12",
    type: "flag",
    title: "Parameter Relation Alert",
    message: "BTEX parameter relation anomaly detected",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    isRead: true,
    priority: "high",
    actionUrl: "/data-validation",
  },
];

// Helper functions
export const getUnreadCount = (): number => {
  return notifications.filter((n) => !n.isRead).length;
};

export const getNotificationsByType = (
  type: NotificationType | "all"
): Notification[] => {
  if (type === "all") return notifications;
  return notifications.filter((n) => n.type === type);
};

export const markAsRead = (id: string): void => {
  const notification = notifications.find((n) => n.id === id);
  if (notification) {
    notification.isRead = true;
  }
};

export const markAllAsRead = (): void => {
  notifications.forEach((n) => {
    n.isRead = true;
  });
};

// Format timestamp to relative time
export const getRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};
