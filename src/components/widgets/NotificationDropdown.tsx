import { useState, useEffect } from "react";
import { X } from "lucide-react";
import NotificationItem from "./NotificationItem";
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

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

type FilterType = "all" | NotificationType;

export default function NotificationDropdown({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [unreadCount, setUnreadCount] = useState(getUnreadCount());

  // Update unread count when notifications change
  useEffect(() => {
    const count = getUnreadCount();
    setUnreadCount(count);
    onUnreadCountChange(count);
  }, [notifications, onUnreadCountChange]);

  // Filter notifications based on active filter
  const filteredNotifications = getNotificationsByType(activeFilter);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);
    setNotifications([...initialNotifications]); // Trigger re-render

    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    onClose();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setNotifications([...initialNotifications]); // Trigger re-render
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
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
                px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap
                ${
                  activeFilter === filter.value
                    ? "bg-teal-600 text-black"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar rounded-b-xl">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-white/50 text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredNotifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                  isFirst={index === 0}
                  isLast={index === filteredNotifications.length - 1}
                />
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
