import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import NotificationDropdown from "./NotificationDropdown";
import { getUnreadCount } from "../../data/notificationData";

export default function Topbar({
  title = "",
}: {
  title?: string;
  view?: "graph" | "table";
  setView?: (v: "graph" | "table") => void;
} = {}) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(getUnreadCount());

  // Update unread count on mount
  useEffect(() => {
    setUnreadCount(getUnreadCount());
  }, []);

  const handleUnreadCountChange = (count: number) => {
    setUnreadCount(count);
  };

  return (
    <header className="flex justify-between items-center bg-[#0f1717] pl-16 pr-6 xl:px-6 border-white/5 border-b h-16">
      <div className="flex items-center gap-3">
        <h1 className="font-semibold text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <Bell className="w-5 h-5 text-white hover:text-gray-300 transition" />
            {/* Badge count */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-[#0f1717] animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            onUnreadCountChange={handleUnreadCountChange}
          />
        </div>

        <p>|</p>
        {/*User Info */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 rounded-full w-8 h-8" />
          <div className="leading-tight">
            <div className="text-sm">John Victor</div>
            <div className="text-[11px] text-gray-400">Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
}
