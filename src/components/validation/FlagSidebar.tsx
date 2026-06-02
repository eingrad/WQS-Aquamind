import { X, Loader2 } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "../modals/ConfirmDialog";
import type { ValidationStatus } from "../../data/validationData";
import {
  validationStatusLabels,
  validationStatusColors,
} from "../../data/validationData";
import api from "../../services/api";

interface FlagSidebarProps {
  onClose: () => void;
  onSuccess: () => void; // Called after API submissions complete
  deviceId: string;
  /**
   * Cells to flag. The sidebar fires one /validation/request-flag call per
   * cell so multi-cell selections aren't silently truncated to the first.
   */
  cells: Array<{ timestamp: string; parameter: string }>;
}

export default function FlagSidebar({
  onClose,
  onSuccess,
  deviceId,
  cells,
}: FlagSidebarProps) {
  const [selectedFlagType, setSelectedFlagType] = useState<
    ValidationStatus | ""
  >("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async () => {
    if (!selectedFlagType) return;
    if (remarks.trim().length < 10) {
      setError("Remarks must be at least 10 characters");
      return;
    }
    if (cells.length === 0) {
      setError("No cells selected");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit one request per selected cell. Using allSettled so a single
      // failed cell doesn't abort the whole batch — partial success is
      // surfaced in the success dialog.
      const results = await Promise.allSettled(
        cells.map((cell) =>
          api.post("/validation/request-flag", {
            deviceId,
            hourTimestamp: cell.timestamp,
            parameter: cell.parameter,
            flagType: selectedFlagType,
            remarks: remarks.trim(),
          }),
        ),
      );

      const successCount = results.filter(
        (r) => r.status === "fulfilled",
      ).length;
      const failed = results.filter((r) => r.status === "rejected") as Array<
        PromiseRejectedResult
      >;

      if (successCount === 0) {
        // All failed — surface the first error.
        const firstErr: any = failed[0]?.reason;
        setError(
          firstErr?.response?.data?.error ||
            firstErr?.message ||
            "Failed to submit flag request",
        );
        return;
      }

      const cellWord = successCount === 1 ? "cell" : "cells";
      let message =
        `${successCount} ${cellWord} flagged successfully!\n\n` +
        `Your request${successCount === 1 ? " is" : "s are"} awaiting admin approval.`;
      if (failed.length > 0) {
        message += `\n\n${failed.length} cell${failed.length === 1 ? "" : "s"} failed to submit — please retry those.`;
      }
      setSuccessMessage(message);
      setShowSuccess(true);
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
      <div className="fixed right-0 top-0 h-full w-[400px] bg-[#ffffff] shadow-2xl shadow-black/50 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Request Flag Approval
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
            <p className="text-sm text-blue-600">
              Flagging {cells.length} cell{cells.length === 1 ? "" : "s"}.
              Your flag request{cells.length === 1 ? "" : "s"} will be
              submitted to an admin for review before being applied to the
              data.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Flag Type Selection */}
          <div>
            <label className="block text-sm text-slate-800 mb-2">
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
                          ? "border-white-500 bg-blue-500"
                          : "border-gray-500"
                      }`}
                    >
                      {selectedFlagType === flagType && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex-1 ${validationStatusColors[flagType]} text-sm text-slate-800 font-medium py-2.5 px-4 rounded-lg text-center`}
                  >
                    {validationStatusLabels[flagType]}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm text-slate-800 mb-2">
              Remarks<span className="text-red-500"> *</span>
              <span className="text-slate-500 text-xs ml-2">
                (minimum 10 characters)
              </span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={8}
              placeholder="Explain why you're flagging this data (minimum 10 characters)..."
              className="w-full px-4 py-3 rounded-lg bg-[#ffffff] text-slate-800 text-sm border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 resize-none focus:outline-none placeholder-gray-500"
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500 mt-1">
              {remarks.length} / 1000 characters
            </p>
          </div>
        </div>

        {/* Footer with Submit Button */}
        <div className="px-6 py-4 border-t border-slate-200">
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={
                !selectedFlagType || isSubmitting || remarks.trim().length < 10
              }
              className="flex-1 bg-blue-600 text-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              className="px-6 py-3 rounded-lg text-sm font-medium border border-slate-200 text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <ConfirmDialog
        isOpen={showSuccess}
        title="Request Submitted"
        message={successMessage}
        confirmText="OK"
        type="success"
        onConfirm={() => {
          setShowSuccess(false);
          onSuccess();
          onClose();
        }}
      />
    </>
  );
}
