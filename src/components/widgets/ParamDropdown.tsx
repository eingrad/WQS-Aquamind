import { useState } from "react";
import { PARAMETERS } from "../../data/constants";

type Props = {
  selectedParams: string[];
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  getUnit: (key: string) => string;
};

export default function ParamDropdown({
  selectedParams,
  onToggle,
  onSelectAll,
  onDeselectAll,
  getUnit,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const label =
    selectedParams.length === PARAMETERS.length
      ? "All Parameters"
      : selectedParams.length === 1
        ? PARAMETERS.find((p) => p.key === selectedParams[0])?.label
        : `${selectedParams.length} Parameters`;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#0d1717] to-[#0d1717] border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer min-w-[220px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none text-left"
        >
          {label}
        </button>
        <ChevronIcon
          className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${isOpen ? "rotate-180" : ""}`}
        />

        {isOpen && (
          <div className="absolute top-full mt-2 z-50 bg-[#1a2a2a] rounded-lg shadow-2xl border border-white/10 overflow-hidden min-w-[260px]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
              <button
                onClick={onSelectAll}
                className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={onDeselectAll}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
              >
                Deselect All
              </button>
            </div>

            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
              {PARAMETERS.map((param) => (
                <label
                  key={param.key}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedParams.includes(param.key)}
                    onChange={() => onToggle(param.key)}
                    className="w-4 h-4 rounded border-white/20 bg-transparent text-teal-500 focus:ring-teal-500/20 focus:ring-offset-0 cursor-pointer accent-teal-500"
                  />
                  <span className="text-sm text-gray-200">{param.label}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {getUnit(param.key)}
                  </span>
                </label>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t border-white/10">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-teal-600 text-black text-sm font-medium py-2 rounded-lg hover:bg-teal-500 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 text-teal-400 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}
