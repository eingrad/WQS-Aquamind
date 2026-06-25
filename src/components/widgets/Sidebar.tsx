import type { JSX } from "react";
import { useState, useMemo } from "react";
import { getStorageItem, STORAGE_KEYS } from "../../utils/storage";
import aquamindLogo from "../../assets/aquamind-logo-short.png";
import {
  CircleGauge,
  MapPin,
  ClipboardList,
  X,
  Settings,
  MessageCircleQuestionMark,
  CheckCircle,
  Flag,
  Bell,
  History,
  BarChart3,
  BookOpen,
  Wrench,
  SlidersHorizontal,
} from "lucide-react";

/** All known role IDs — matches backend seed.ts */
type UserRole = "admin" | "qa_qc" | "technician" | "user";

const ALL_ROLES: UserRole[] = ["admin", "qa_qc", "technician", "user"];

/** Map display names (roleName) to roleId for resilient matching */
const ROLE_NAME_MAP: Record<string, UserRole> = {
  administrator: "admin",
  admin: "admin",
  "qa/qc": "qa_qc",
  qa_qc: "qa_qc",
  technician: "technician",
  user: "user",
};

interface MenuItem {
  label: string;
  href: string;
  icon: JSX.Element;
  /** Which roles may see this item. Omit (or use ALL_ROLES) for universal access. */
  allowedRoles: UserRole[];
  /** Optional section divider rendered before this item */
  sectionTitle?: string;
}

/**
 * Read the current user's role from localStorage.
 * Checks roleId first, then falls back to matching roleName.
 * Falls back to "user" (most restrictive) if unavailable.
 */
const getUserRole = (): UserRole => {
  try {
    const parsed = getStorageItem<Record<string, any>>(STORAGE_KEYS.USER);
    if (!parsed) return "user";

    // Try direct roleId match first
    const roleId = parsed?.role || parsed?.userRole?.roleId;
    if (roleId && ALL_ROLES.includes(roleId)) return roleId as UserRole;

    // Fallback: match by roleName (handles cases where roleId differs from expected values)
    const roleName = parsed?.roleName || parsed?.userRole?.role?.roleName;
    if (roleName) {
      const mapped = ROLE_NAME_MAP[roleName.toLowerCase()];
      if (mapped) return mapped;
    }

    // Also try matching roleId through the name map (e.g. if roleId is a display name)
    if (roleId) {
      const mapped = ROLE_NAME_MAP[roleId.toLowerCase()];
      if (mapped) return mapped;
    }

    if (roleId || roleName) {
      console.warn(
        `[Sidebar] Unrecognized role: roleId="${roleId}", roleName="${roleName}". Falling back to "user".`,
      );
    }
    return "user";
  } catch {
    return "user";
  }
};

export default function Sidebar({
  active = "Dashboard",
  isOpen: isOpenProp,
  onToggle,
}: {
  active?: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalOpen;
  const setIsOpen = onToggle || setInternalOpen;

  const userRole = getUserRole();

  /**
   * Menu items with role-based visibility:
   *  - admin & qa_qc  → all items
   *  - technician      → all except Data Approval
   *  - user            → all except Analytics, Data Validation, Data Approval
   */
  const menuItems: MenuItem[] = useMemo(
    () => [
      // ── MAIN MENU ──
      {
        label: "Overview",
        href: "/overview",
        icon: <MapPin className="w-5 h-5" />,
        allowedRoles: ALL_ROLES,
      },
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <CircleGauge className="w-5 h-5" />,
        allowedRoles: ALL_ROLES,
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: <BarChart3 className="w-5 h-5" />,
        allowedRoles: ALL_ROLES,
      },
      {
        label: "Report",
        href: "/reports",
        icon: <ClipboardList className="w-5 h-5" />,
        allowedRoles: ALL_ROLES,
      },
      {
        label: "Data Validation",
        href: "/data-validation",
        icon: <Flag className="w-5 h-5" />,
        allowedRoles: ["admin", "qa_qc", "technician"],
      },
      {
        label: "Data Approval",
        href: "/data-approval",
        icon: <CheckCircle className="w-5 h-5" />,
        allowedRoles: ["admin", "qa_qc"],
      },
      {
        label: "Alert Thresholds",
        href: "/alert-thresholds",
        icon: <Bell className="w-5 h-5" />,
        allowedRoles: ALL_ROLES,
      },
      {
        label: "Alert History",
        href: "/alert-history",
        icon: <History className="w-5 h-5" />,
        allowedRoles: ALL_ROLES,
      },
      {
        label: "Knowledge Center",
        href: "/parameters",
        icon: <BookOpen className="w-5 h-5" />,
        allowedRoles: ALL_ROLES,
      },
      {
        label: "Maintenance",
        href: "/maintenance",
        icon: <Wrench className="w-5 h-5" />,
        allowedRoles: ["admin", "technician"],
      },
      {
        label: "Calibration",
        href: "/calibration",
        icon: <SlidersHorizontal className="w-5 h-5" />,
        allowedRoles: ["admin", "technician"],
      },

      // ── SYSTEM ──
      {
        label: "Settings",
        href: "/settings",
        icon: <Settings className="w-5 h-5" />,
        allowedRoles: ALL_ROLES,
        sectionTitle: "SYSTEM",
      },
      {
        label: "Help",
        href: "#",
        icon: <MessageCircleQuestionMark className="w-5 h-5" />,
        allowedRoles: ALL_ROLES,
      },
    ],
    [],
  );

  /** Items visible to the current user */
  const visibleItems = useMemo(
    () => menuItems.filter((item) => item.allowedRoles.includes(userRole)),
    [menuItems, userRole],
  );

  const Item = ({
    label,
    href,
    icon,
  }: {
    label: string;
    href: string;
    icon?: JSX.Element;
  }) => (
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
        active === label
          ? "bg-blue-600 text-black"
          : "hover:bg-slate-100 text-slate-700"
      }`}
      onClick={() => setIsOpen(false)}
    >
      {icon}
      {label}
    </a>
  );

  return (
    <>
      {/* Overlay backdrop when sidebar is open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[1040] xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`space-y-2 bg-[#ffffff] p-4 border-slate-200 border-r text-slate-800
          w-[16rem] max-w-[16rem] min-h-screen z-[1050]
          transform xl:translate-x-0 transition-transform duration-300 ease-in-out
          fixed xl:relative top-0 left-0
          ${isOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}
        `}
      >
        {/* Close button - visible on mobile only */}
        <div className="flex justify-end xl:hidden">
          <button
            onClick={() => setIsOpen(false)}
            className="bg-[#2563eb] p-2 rounded-full text-white shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center px-3 pb-5 pt-2">
          <a
            href="/overview"
            className="block w-full transition-all duration-300 hover:scale-105 active:scale-95 group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setIsOpen(false)}
          >
            <img
              src={aquamindLogo}
              alt="AquaMind"
              className="w-full h-auto transition-all duration-300 group-hover:brightness-110"
            />
          </a>
        </div>

        {/* Menu Title */}
        <div className="px-2 pb-2 text-[11px] text-slate-500">MAIN MENU</div>

        {/* Navigation Items — filtered by role */}
        <nav className="space-y-2">
          {visibleItems.map((item) => (
            <div key={item.label}>
              {item.sectionTitle && (
                <div className="px-2 pt-4 pb-2 text-[11px] text-slate-500">
                  {item.sectionTitle}
                </div>
              )}
              <Item label={item.label} href={item.href} icon={item.icon} />
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
