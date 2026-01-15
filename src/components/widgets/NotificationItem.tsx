import React from "react";
import { CheckCircle, Flag, Settings } from "lucide-react";
import type {
  Notification,
  NotificationType,
} from "../../data/notificationData";
import {
  notificationTypeColors,
  notificationTypeBgColors,
  priorityColors,
  getRelativeTime,
} from "../../data/notificationData";

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const typeIcons: Record<NotificationType, React.JSX.Element> = {
  approval: <CheckCircle className="w-5 h-5" />,
  validation: <CheckCircle className="w-5 h-5" />,
  flag: <Flag className="w-5 h-5" />,
  system: <Settings className="w-5 h-5" />,
};

export default function NotificationItem({
  notification,
  onClick,
  isFirst = false,
  isLast = false,
}: NotificationItemProps) {
  const borderColor = notificationTypeColors[notification.type];
  const bgColor = notificationTypeBgColors[notification.type];
  const priorityColor = priorityColors[notification.priority];

  return (
    <div
      onClick={() => onClick(notification)}
      className={`
        relative p-4 border-l-4 ${borderColor} ${
        notification.isRead ? "bg-white/5" : `${bgColor} bg-opacity-20`
      }
        hover:bg-white/10 transition cursor-pointer group
        ${isLast ? "rounded-b-xl" : ""}
      `}
    >
      {/* Unread indicator dot */}
      {!notification.isRead && (
        <span
          className={`absolute top-4 right-4 block h-2 w-2 rounded-full ${priorityColor}`}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 mt-0.5 text-white/70 group-hover:text-white transition`}
        >
          {typeIcons[notification.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm font-medium ${
                notification.isRead ? "text-white/70" : "text-white"
              } group-hover:text-white transition`}
            >
              {notification.title}
            </h4>
          </div>

          <p
            className={`text-xs mt-1 ${
              notification.isRead ? "text-white/50" : "text-white/60"
            } group-hover:text-white/70 transition`}
          >
            {notification.message}
          </p>

          <p className="text-[11px] text-white/40 mt-2">
            {getRelativeTime(notification.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}
