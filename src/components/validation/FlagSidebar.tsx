import { X, Loader2 } from "lucide-react";
import { useState } from "react";
import type { ValidationStatus } from "../../data/validationData";
import {
  validationStatusLabels,
  validationStatusColors,
} from "../../data/validationData";
import api from "../../services/api";

interface FlagSidebarProps {
  onClose: () => void;
  onSuccess: () => void; // Changed from onSubmit - called after successful API submission
  deviceId: string;
  hourTimestamp: string; // ISO string for the selected hour
  parameter: string;
}

export default function FlagSidebar({
  onClose,
  onSuccess,
  deviceId,
  hourTimestamp,
  parameter,
}: FlagSidebarProps) {
  const [selectedFlagType, setSelectedFlagType] = useState<
    ValidationStatus | ""
  >("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedFlagType) return;
    if (remarks.trim().length < 10) {
      setError("Remarks must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Use api service to automatically include auth token
      const response = await api.post("/validation/request-flag", {
        deviceId,
        hourTimestamp,
        parameter,
        flagType: selectedFlagType,
        remarks: remarks.trim(),
      });

      const data = response.data;

      // Success! Call onSuccess to refresh data
      onSuccess();
      onClose();

      // Show success message (you may want to use a toast notification library)
      alert(
        `Flag request submitted successfully!\n\n` +
          `Status: ${data?.data?.status || "pending"}\n` +
          `Records affected: ${data?.data?.recordCount || "unknown"}\n\n` +
          `Your request is awaiting admin approval.`,
      );
    } catch (err: any) {
      console.error("Flag submission error:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Failed to submit flag request";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flag type options (excluding "no_data" and "pending_validation")
  const flagOptions: ValidationStatus[] = [
    "valid",
    "exceeding_range",
    "insufficient_data",
    "parameter_relation",
    "out_of_range",
    "maintenance",
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[400px] bg-[#0f1a1a] shadow-2xl shadow-black/50 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">
            Request Flag Approval
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-teal-900/30 border border-teal-700/50 rounded-lg p-4">
            <p className="text-sm text-teal-300">
              Your flag request will be submitted to an admin for review before
              being applied to the data.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

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
                  onClick={() => !isSubmitting && setSelectedFlagType(flagType)}
                >
                  <div className="relative">
                    <input
                      type="radio"
                      name="flagType"
                      checked={selectedFlagType === flagType}
                      onChange={() => setSelectedFlagType(flagType)}
                      className="sr-only"
                      disabled={isSubmitting}
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
            <label className="block text-sm text-white mb-2">
              Remarks<span className="text-red-500"> *</span>
              <span className="text-gray-400 text-xs ml-2">
                (minimum 10 characters)
              </span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={8}
              placeholder="Explain why you're flagging this data (minimum 10 characters)..."
              className="w-full px-4 py-3 rounded-lg bg-[#0f1a1a] text-white text-sm border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 resize-none focus:outline-none placeholder-gray-500"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-400 mt-1">
              {remarks.length} / 1000 characters
            </p>
          </div>
        </div>

        {/* Footer with Submit Button */}
        <div className="px-6 py-4 border-t border-white/10">
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={
                !selectedFlagType || isSubmitting || remarks.trim().length < 10
              }
              className="flex-1 bg-teal-600 text-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Approval"
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
