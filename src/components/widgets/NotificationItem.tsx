import {
  AlertTriangle,
  AlertOctagon,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";

export type NotificationPriority = "high" | "medium" | "low";
export type NotificationSeverity =
  | "warning"
  | "critical"
  | "emergency"
  | "approval_request"
  | "approval_decision";

export interface Notification {
  id: string;
  type: NotificationSeverity;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

// Severity-based styling
const severityConfig = {
  warning: {
    borderColor: "border-yellow-500",
    bgColor: "bg-yellow-500/10",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  critical: {
    borderColor: "border-orange-500",
    bgColor: "bg-orange-500/10",
    icon: <AlertOctagon className="w-5 h-5" />,
  },
  emergency: {
    borderColor: "border-red-500",
    bgColor: "bg-red-500/10",
    icon: <AlertOctagon className="w-5 h-5" />,
  },
  approval_request: {
    borderColor: "border-blue-500",
    bgColor: "bg-blue-500/10",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  approval_decision: {
    borderColor: "border-blue-500",
    bgColor: "bg-blue-500/10",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
};

const priorityColors: Record<NotificationPriority, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

// Format timestamp to relative time
const getRelativeTime = (timestamp: string): string => {
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

export default function NotificationItem({
  notification,
  onClick,
  isLast = false,
}: NotificationItemProps) {
  const config = severityConfig[notification.type] || severityConfig.warning;
  const borderColor = config.borderColor;
  const bgColor = config.bgColor;
  const priorityColor = priorityColors[notification.priority];

  return (
    <div
      onClick={() => onClick(notification)}
      className={`
        relative p-4 border-l-4 ${borderColor} ${
          notification.isRead ? "bg-slate-100" : `${bgColor} bg-opacity-20`
        }
        hover:bg-slate-100 transition cursor-pointer group
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
          className={`flex-shrink-0 mt-0.5 text-slate-500 group-hover:text-slate-800 transition`}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm font-medium ${
                notification.isRead ? "text-slate-500" : "text-slate-800"
              } group-hover:text-slate-800 transition`}
            >
              {notification.title}
            </h4>
          </div>

          <p
            className={`text-xs mt-1 ${
              notification.isRead ? "text-slate-500" : "text-slate-500"
            } group-hover:text-slate-500 transition`}
          >
            {notification.message}
          </p>

          <p className="text-[11px] text-slate-500 mt-2">
            {getRelativeTime(notification.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}
