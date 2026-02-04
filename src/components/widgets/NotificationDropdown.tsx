import { useState, useEffect } from "react";
import { X, Bell, AlertCircle } from "lucide-react";
import * as notificationService from "../../services/notification.service";
import NotificationItem from "./NotificationItem";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

type FilterType = "all" | "warning" | "critical" | "emergency" | "approvals";

export default function NotificationDropdown({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from API
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const alerts = await notificationService.getNotifications(false);
      setNotifications(alerts);

      // Count unread notifications
      const unread = alerts.filter((a) => !a.isRead).length;
      setUnreadCount(unread);
      onUnreadCountChange(unread);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  // Filter notifications by severity or type
  const filteredNotifications =
    activeFilter === "all"
      ? notifications
      : activeFilter === "approvals"
        ? notifications.filter(
            (n) =>
              n.type === "approval_request" || n.type === "approval_decision",
          )
        : notifications.filter(
            (n) => n.severity === activeFilter || n.type === activeFilter,
          );

  // Sort by timestamp (newest first)
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const timeA = new Date(a.createdAt);
    const timeB = new Date(b.createdAt);
    return timeB.getTime() - timeA.getTime();
  });

  const handleNotificationClick = async (notification: any) => {
    try {
      await notificationService.markAsRead(notification.id);
      await loadNotifications(); // Reload to update count
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    // Navigate based on notification type
    if (notification.type === "approval_request") {
      // Admin received approval request → go to Data Approval page
      window.location.href = `/data-validation-approval`;
    } else if (notification.type === "approval_decision") {
      // QC user received approval decision → go to Data Validation page
      window.location.href = `/data-validation`;
    } else if (notification.alertHistoryId) {
      // Alert notification → go to Alert History page
      window.location.href = `/alert-history`;
    }

    onClose();
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Approvals", value: "approvals" },
    { label: "Warning", value: "warning" },
    { label: "Critical", value: "critical" },
    { label: "Emergency", value: "emergency" },
  ];

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .notification-scroll::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }
        .notification-scroll::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        .notification-scroll::-webkit-scrollbar-thumb {
          background: #14b8a6;
          border-radius: 4px;
        }
        .notification-scroll::-webkit-scrollbar-thumb:hover {
          background: #0d9488;
        }
        .notification-scroll {
          scrollbar-width: thin;
          scrollbar-color: #14b8a6 #1f2937;
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown Panel */}
      <div
        className="absolute top-full right-0 mt-2 w-98 max-w-[calc(100vw-2rem)]
                   bg-[#0f1a1a] border border-gray-700 rounded-xl shadow-2xl z-50
                   flex flex-col max-h-[600px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">
                Notifications
              </h3>
              <p className="text-xs text-gray-400">{unreadCount} unread</p>
            </div>
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
              className="text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-3 border-b border-gray-700 overflow-x-auto overflow-y-hidden notification-scroll flex-shrink-0 min-w-0">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`flex items-center gap-2 px-3 h-8 text-xs font-medium rounded-lg transition whitespace-nowrap flex-shrink-0 ${
                activeFilter === filter.value
                  ? "bg-teal-600/20 text-teal-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {filter.label}
              {filter.value !== "all" && (
                <span className="px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-300 text-xs">
                  {filter.value === "approvals"
                    ? notifications.filter(
                        (n) =>
                          (n.type === "approval_request" ||
                            n.type === "approval_decision") &&
                          !n.isRead,
                      ).length
                    : notifications.filter(
                        (n) => n.severity === filter.value && !n.isRead,
                      ).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto notification-scroll">
          {sortedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <AlertCircle className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {sortedNotifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={{
                    id: notification.id,
                    type: notification.type || notification.severity, // Use type field for approvals
                    title: notification.title,
                    message: notification.message,
                    timestamp: notification.createdAt,
                    isRead: notification.isRead,
                    priority:
                      notification.severity === "emergency"
                        ? "high"
                        : notification.severity === "critical"
                          ? "medium"
                          : ("low" as any),
                    actionUrl: notification.alertHistoryId
                      ? `/alert-history`
                      : undefined,
                  }}
                  onClick={handleNotificationClick}
                  isLast={index === sortedNotifications.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
