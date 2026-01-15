import { X } from "lucide-react";
import { useState } from "react";
import type { ValidationStatus } from "../../data/validationData";
import {
  validationStatusLabels,
  validationStatusColors,
} from "../../data/validationData";

interface FlagSidebarProps {
  onClose: () => void;
  onSubmit: (flagType: ValidationStatus, remarks: string) => void;
}

export default function FlagSidebar({ onClose, onSubmit }: FlagSidebarProps) {
  const [selectedFlagType, setSelectedFlagType] = useState<
    ValidationStatus | ""
  >("");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = () => {
    if (!selectedFlagType) return;
    onSubmit(selectedFlagType as ValidationStatus, remarks);
    onClose();
  };

  // Flag type options (excluding "no_data" and "pending_validation")
  const flagOptions: ValidationStatus[] = [
    "valid",
    "exceeding_range",
    "insufficient_data",
    "parameter_relation",
    "out_of_range",
    "maintenance",
    "qc_checks",
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[400px] bg-[#0f1a1a] shadow-2xl shadow-black/50 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Flag Data</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Flag Type Selection */}
          <div>
            <label className="block text-sm text-white mb-2">
              Select Flag Type<span className="text-red-500"> *</span>
            </label>
            <div className="space-y-3">
              {flagOptions.map((flagType) => (
                <label
                  key={flagType}
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setSelectedFlagType(flagType)}
                >
                  <div className="relative">
                    <input
                      type="radio"
                      name="flagType"
                      checked={selectedFlagType === flagType}
                      onChange={() => setSelectedFlagType(flagType)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedFlagType === flagType
                          ? "border-white-500 bg-teal-500"
                          : "border-gray-500"
                      }`}
                    >
                      {selectedFlagType === flagType && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex-1 ${validationStatusColors[flagType]} text-sm text-white font-medium py-2.5 px-4 rounded-lg text-center`}
                  >
                    {validationStatusLabels[flagType]}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm text-white mb-2">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={8}
              placeholder="Enter your remarks here..."
              className="w-full px-4 py-3 rounded-lg bg-[#0f1a1a] text-white text-sm border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 resize-none focus:outline-none placeholder-gray-500"
            />
          </div>
        </div>

        {/* Footer with Submit Button */}
        <div className="px-6 py-4 border-t border-white/10">
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!selectedFlagType}
              className="flex-1 bg-teal-600 text-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
