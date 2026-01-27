import { useState, useEffect } from "react";
import { X, Bell, AlertCircle } from "lucide-react";
import type {
  Notification,
  NotificationType,
} from "../../data/notificationData";
import {
  notifications as initialNotifications,
  getNotificationsByType,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "../../data/notificationData";
import * as notificationService from "../../services/notification.service";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

type FilterType = "all" | "alerts" | NotificationType;

export default function NotificationDropdown({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [alertNotifications, setAlertNotifications] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [unreadCount, setUnreadCount] = useState(getUnreadCount());
  const [alertUnreadCount, setAlertUnreadCount] = useState(0);

  // Fetch alert notifications from API
  useEffect(() => {
    if (isOpen) {
      loadAlertNotifications();
    }
  }, [isOpen]);

  const loadAlertNotifications = async () => {
    try {
      const alerts = await notificationService.getNotifications(false);
      setAlertNotifications(alerts);

      // Count unread alert notifications
      const unreadAlerts = alerts.filter((a) => !a.isRead).length;
      setAlertUnreadCount(unreadAlerts);
    } catch (error) {
      console.error("Failed to load alert notifications:", error);
    }
  };

  // Update unread count when notifications change
  useEffect(() => {
    const localUnread = getUnreadCount();
    const totalUnread = localUnread + alertUnreadCount;
    setUnreadCount(totalUnread);
    onUnreadCountChange(totalUnread);
  }, [notifications, alertUnreadCount, onUnreadCountChange]);

  // Convert alert notifications to display format
  const formattedAlertNotifications = alertNotifications.map((alert) => ({
    id: alert.id,
    type: "alert" as const,
    title: alert.title,
    message: alert.message,
    timestamp: new Date(alert.createdAt),
    isRead: alert.isRead,
    severity: alert.severity,
    actionUrl: alert.alertHistoryId ? `/alert-history` : undefined,
  }));

  // Combine and filter notifications
  let combinedNotifications: any[] = [];

  if (activeFilter === "all") {
    combinedNotifications = [...formattedAlertNotifications, ...notifications];
  } else if (activeFilter === "alerts") {
    combinedNotifications = formattedAlertNotifications;
  } else {
    combinedNotifications = getNotificationsByType(activeFilter);
  }

  // Sort by timestamp (newest first)
  combinedNotifications.sort((a, b) => {
    const timeA =
      a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const timeB =
      b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return timeB.getTime() - timeA.getTime();
  });

  const handleNotificationClick = async (notification: any) => {
    // If it's an alert notification, mark as read via API
    if (notification.type === "alert") {
      try {
        await notificationService.markAsRead(notification.id);
        await loadAlertNotifications(); // Reload to update count
      } catch (error) {
        console.error("Failed to mark alert as read:", error);
      }
    } else {
      // Local notification
      markAsRead(notification.id);
      setNotifications([...initialNotifications]);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    onClose();
  };

  const handleMarkAllAsRead = async () => {
    // Mark local notifications as read
    markAllAsRead();
    setNotifications([...initialNotifications]);

    // Mark alert notifications as read
    try {
      await notificationService.markAllAsRead();
      await loadAlertNotifications();
    } catch (error) {
      console.error("Failed to mark all alerts as read:", error);
    }
  };

  const filters: { label: string; value: FilterType; icon?: any }[] = [
    { label: "All", value: "all" },
    { label: "Alerts", value: "alerts", icon: Bell },
    { label: "Approvals", value: "approval" },
    { label: "Validations", value: "validation" },
    { label: "Flags", value: "flag" },
    { label: "System", value: "system" },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown Panel */}
      <div
        className="absolute top-full right-0 mt-2 w-96 max-w-[calc(100vw-2rem)]
          bg-[#0f1717] border border-white/10 rounded-xl shadow-2xl z-50
          animate-in slide-in-from-top-2 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-teal-600 text-black rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-teal-400 hover:text-teal-300 transition"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-white/10 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap
                ${
                  activeFilter === filter.value
                    ? "bg-teal-600 text-black"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              {filter.icon && <filter.icon className="w-3.5 h-3.5" />}
              {filter.label}
              {filter.value === "alerts" && alertUnreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {alertUnreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar rounded-b-xl">
          {combinedNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-white/50 text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {combinedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-4 cursor-pointer transition hover:bg-white/5
                    ${!notification.isRead ? "bg-teal-500/5" : ""}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`
                      mt-0.5 p-2 rounded-lg
                      ${
                        notification.type === "alert"
                          ? notification.severity === "emergency"
                            ? "bg-red-500/20 text-red-400"
                            : notification.severity === "critical"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          : "bg-blue-500/20 text-blue-400"
                      }
                    `}
                    >
                      {notification.type === "alert" ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm text-white">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-white/60 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-white/40 mt-2">
                        {new Date(notification.timestamp).toLocaleString(
                          "en-MY",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "short",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
}
