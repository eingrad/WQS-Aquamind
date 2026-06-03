import { Bell, LogOut, ChevronDown, Menu } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import NotificationDropdown from "./NotificationDropdown";
import * as notificationService from "../../services/notification.service";
import { logout } from "../../services/auth.service";
import { getStorageItem, STORAGE_KEYS } from "../../utils/storage";

export default function Topbar({
  title = "",
  onMenuToggle,
}: {
  title?: string;
  view?: "graph" | "table";
  setView?: (v: "graph" | "table") => void;
  onMenuToggle?: () => void;
} = {}) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get user info from storage (supports both localStorage and sessionStorage)
  const storedUser = getStorageItem<Record<string, any>>(STORAGE_KEYS.USER);

  const userName = storedUser?.fullName || storedUser?.name || "User";
  const userRole = storedUser?.roleName || storedUser?.userRole?.role?.roleName || storedUser?.role || "Admin";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Fetch real unread count from API on mount
  useEffect(() => {
    notificationService
      .getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUnreadCountChange = (count: number) => {
    setUnreadCount(count);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="flex justify-between items-center bg-[#ffffff] px-4 xl:px-6 border-slate-200 border-b h-16 relative z-[1000]">
      <div className="flex items-center gap-3">
        {/* Burger menu button - inline, scrolls with page, visible on mobile only */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="bg-[#2563eb] p-2 rounded-full text-white shadow-md xl:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="font-semibold text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="group relative w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
          >
            <Bell className="w-5 h-5 text-slate-800 origin-top transition-colors group-hover:text-blue-600 group-hover:animate-[bell-ring_0.7s_ease-in-out]" />
            {/* Badge count */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-[#ffffff] animate-pulse">
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

        {/* User Info with Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-all duration-200 cursor-pointer group"
          >
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold text-slate-800 shadow-lg shadow-blue-500/20">
              {userInitials}
            </div>
            <div className="leading-tight text-left">
              <div className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                {userName}
              </div>
              <div className="text-[11px] text-slate-500">{userRole}</div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                isUserMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#ffffff] border border-slate-200 rounded-xl shadow-xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold text-slate-800">
                    {userInitials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{userName}</p>
                    <p className="text-xs text-slate-500">{userRole}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-500/10 transition-colors duration-150"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
