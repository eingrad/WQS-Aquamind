//NOT USED ON CODEBASE

import { X } from "lucide-react";

interface ValidationSidebarProps {
  isOpen: boolean;
  validationType: string;
  validateValue: string;
  validationMode: "Corrected" | "Estimated";
  onClose: () => void;
  onValidationTypeChange: (type: string) => void;
  onValidateValueChange: (value: string) => void;
  onValidationModeChange: (mode: "Corrected" | "Estimated") => void;
  onSubmit: () => void;
}

export default function ValidationSidebar({
  isOpen,
  validationType,
  validateValue,
  validationMode,
  onClose,
  onValidationTypeChange,
  onValidateValueChange,
  onValidationModeChange,
  onSubmit,
}: ValidationSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[400px] bg-[#ffffff] shadow-2xl shadow-black/50 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Validate Data</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Validation Type */}
          <div>
            <label className="block text-sm text-slate-800 mb-2">
              Select Validation Type<span className="text-red-500"> *</span>
            </label>
            <div className="relative">
              <select
                value={validationType}
                onChange={(e) => onValidationTypeChange(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-lg bg-[#e2e8f0] text-sm border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
              >
                <option value="Addition">Addition</option>
                <option value="Multiplication">Multiplication</option>
                <option value="Constant">Constant</option>
                <option value="Original">Original</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Validate Value Input */}
          <div>
            <label className="block text-sm text-slate-800 mb-2">
              Enter Validate Value<span className="text-red-500"> *</span>
            </label>
            <input
              type="text"
              value={validateValue}
              onChange={(e) => onValidateValueChange(e.target.value)}
              placeholder="Enter value..."
              className="w-full px-4 py-3 pr-10 rounded-lg bg-[#e2e8f0] text-sm border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
            />
          </div>

          {/* Corrected / Estimated */}
          <div>
            <div className="space-y-3">
              <label
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => onValidationModeChange("Corrected")}
              >
                <div className="relative">
                  <input
                    type="radio"
                    name="validationMode"
                    checked={validationMode === "Corrected"}
                    onChange={() => onValidationModeChange("Corrected")}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      validationMode === "Corrected"
                        ? "border-white-500 bg-blue-500"
                        : "border-gray-500"
                    }`}
                  >
                    {validationMode === "Corrected" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1 bg-blue-600/80 text-sm text-white font-medium py-2.5 px-4 rounded-lg text-center">
                  Corrected
                </div>
              </label>

              <label
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => onValidationModeChange("Estimated")}
              >
                <div className="relative">
                  <input
                    type="radio"
                    name="validationMode"
                    checked={validationMode === "Estimated"}
                    onChange={() => onValidationModeChange("Estimated")}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      validationMode === "Estimated"
                        ? "border-white-500 bg-blue-500"
                        : "border-gray-500"
                    }`}
                  >
                    {validationMode === "Estimated" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1 bg-blue-600/80 text-sm text-white font-medium py-2.5 px-4 rounded-lg text-center">
                  Estimated
                </div>
              </label>
            </div>
          </div>
        </div>
        {/* Footer with Submit Button */}
        <div className="px-6 py-4 border-t border-slate-200">
          <button
            onClick={onSubmit}
            disabled={!validateValue}
            className="w-full bg-blue-600 hover:bg-blue-700 text-sm disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Apply Validation
          </button>
        </div>
      </div>
    </>
  );
}
