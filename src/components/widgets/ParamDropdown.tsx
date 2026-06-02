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
          className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#ffffff] to-[#ffffff] border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer min-w-[220px] hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none text-left"
        >
          {label}
        </button>
        <ChevronIcon
          className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${isOpen ? "rotate-180" : ""}`}
        />

        {isOpen && (
          <div className="absolute top-full mt-2 z-50 bg-[#e2e8f0] rounded-lg shadow-2xl border border-slate-200 overflow-hidden min-w-[260px]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200">
              <button
                onClick={onSelectAll}
                className="text-xs text-blue-600 hover:text-blue-600 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={onDeselectAll}
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                Deselect All
              </button>
            </div>

            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
              {PARAMETERS.map((param) => (
                <label
                  key={param.key}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedParams.includes(param.key)}
                    onChange={() => onToggle(param.key)}
                    className="w-4 h-4 rounded border-slate-200 bg-transparent text-blue-500 focus:ring-blue-500/20 focus:ring-offset-0 cursor-pointer accent-blue-500"
                  />
                  <span className="text-sm text-slate-700">{param.label}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {getUnit(param.key)}
                  </span>
                </label>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t border-slate-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-blue-600 text-black text-sm font-medium py-2 rounded-lg hover:bg-blue-500 transition-colors"
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
      className={`w-4 h-4 text-blue-600 ${className}`}
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
