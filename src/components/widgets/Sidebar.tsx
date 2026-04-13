import type { JSX } from "react";
import { useState } from "react";
import logoSrc from "../../assets/petronas-logo-dark-whiteText.svg";
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
} from "lucide-react";

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
          ? "bg-teal-600 text-black"
          : "hover:bg-white/5 text-gray-200"
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
        className={`space-y-2 bg-[#121b1b] p-4 border-white/5 border-r text-white
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
            className="bg-[#14b8a6] p-2 rounded-full text-white shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 px-8 pb-5 pt-2">
          <a
            href="/overview"
            className="block transition-all duration-300 hover:scale-105 active:scale-95 group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            onClick={() => setIsOpen(false)}
          >
            <img
              src={logoSrc}
              alt="PETRONAS"
              className="w-35 h-20 transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-[0_0_15px_rgba(20,184,166,0.2)]"
            />
          </a>
        </div>

        {/* Menu Title */}
        <div className="px-2 pb-2 text-[11px] text-gray-400">MAIN MENU</div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          <Item
            label="Overview"
            href="/overview"
            icon={<MapPin className="w-5 h-5" />}
          />
          <Item
            label="Dashboard"
            href="/dashboard"
            icon={<CircleGauge className="w-5 h-5" />}
          />
          <Item
            label="Analytics"
            href="/analytics"
            icon={<BarChart3 className="w-5 h-5" />}
          />

          <Item
            label="Report"
            href="/reports"
            icon={<ClipboardList className="w-5 h-5" />}
          />
          <Item
            label="Data Validation"
            href="/data-validation"
            icon={<Flag className="w-5 h-5" />}
          />
          <Item
            label="Data Approval"
            href="/data-approval"
            icon={<CheckCircle className="w-5 h-5" />}
          />

          {/* Alert Management Section */}
          <Item
            label="Alert Thresholds"
            href="/alert-thresholds"
            icon={<Bell className="w-5 h-5" />}
          />
          <Item
            label="Alert History"
            href="/alert-history"
            icon={<History className="w-5 h-5" />}
          />

          <Item
            label="Knowledge Center"
            href="/parameters"
            icon={<BookOpen className="w-5 h-5" />}
          />

          <div className="px-2 pt-4 pb-2 text-[11px] text-gray-400">SYSTEM</div>
          <Item
            label="Settings"
            href="/settings"
            icon={<Settings className="w-5 h-5" />}
          />
          <Item
            label="Help"
            href="#"
            icon={<MessageCircleQuestionMark className="w-5 h-5" />}
          />
        </nav>
      </aside>
    </>
  );
}
