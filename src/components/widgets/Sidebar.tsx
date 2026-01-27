import type { JSX } from "react";
import { useState } from "react";
import logoSrc from "../../assets/petronas-logo-dark-whiteText.svg";
import {
  CircleGauge,
  MapPin,
  ClipboardList,
  Menu,
  X,
  Settings,
  MessageCircleQuestionMark,
  CheckCircle,
  Flag,
  Bell,
  History,
} from "lucide-react";

export default function Sidebar({ active = "Dashboard" }: { active?: string }) {
  const [isOpen, setIsOpen] = useState(false);

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
      onClick={() => setIsOpen(false)} // Auto-close sidebar on mobile after clicking
    >
      {icon}
      {label}
    </a>
  );

  return (
    <>
      {/* Ripple / Hamburger Button (visible on mobile only) */}
      <div className="fixed top-3 left-4 z-50 xl:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#14b8a6] p-2 rounded-full text-white shadow-md"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`space-y-2 bg-[#121b1b] p-4 border-white/5 border-r text-white
          w-[16rem] max-w-[16rem] min-h-screen z-40
          transform xl:translate-x-0 transition-transform duration-300 ease-in-out
          fixed xl:relative top-0 left-0
          ${isOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-8 pb-5">
          <img src={logoSrc} alt="PETRONAS" className="w-35 h-20" />
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
