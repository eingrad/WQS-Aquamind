import { X } from "lucide-react";
import type { ApprovalDataRow } from "../../data/approvalData";
import {
  approvalTypeLabels,
  approvalTypeColors,
} from "../../data/approvalData";
import { validationStatusLabels } from "../../data/validationData";
import { useState } from "react";
import { formatPollutantValue } from "../../utils/numberFormat";

interface ApprovalActionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRow: ApprovalDataRow | null;
  onApprove: (id: string, adminRemarks: string) => void;
  onReject: (id: string, adminRemarks: string) => void;
}

export default function ApprovalActionSidebar({
  isOpen,
  onClose,
  selectedRow,
  onApprove,
  onReject,
}: ApprovalActionSidebarProps) {
  const [adminRemarks, setAdminRemarks] = useState("");

  const handleApprove = () => {
    if (selectedRow) {
      onApprove(selectedRow.id, adminRemarks);
      setAdminRemarks("");
      onClose();
    }
  };

  const handleReject = () => {
    if (selectedRow) {
      onReject(selectedRow.id, adminRemarks);
      setAdminRemarks("");
      onClose();
    }
  };

  if (!isOpen || !selectedRow) return null;

  const approvalTypeLabel = approvalTypeLabels[selectedRow.approvalType];
  const approvalTypeColor = approvalTypeColors[selectedRow.approvalType];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-[#0d1616] border-l border-white/10 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Approval Action</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Type Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Action:</span>
            <span
              className={`${approvalTypeColor} px-3 py-1 rounded text-xs font-medium text-white`}
            >
              {approvalTypeLabel}
            </span>
          </div>

          {/* Validation Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase">
              {selectedRow.approvalType === "flag"
                ? "Flag Details"
                : "Validation Details"}
            </h3>

            <div className="space-y-3">
              {selectedRow.dataCapturedAt && (
                <div>
                  <span className="text-sm text-gray-500">Data Captured</span>
                  <p className="text-white">{selectedRow.dataCapturedAt}</p>
                </div>
              )}

              <div>
                <span className="text-sm text-gray-500">Flagged At</span>
                <p className="text-white">{selectedRow.time}</p>
              </div>

              {selectedRow.approvalType === "flag" && (
                <div>
                  <span className="text-sm text-gray-500">Flag Type</span>
                  <p className="text-white">
                    {validationStatusLabels[selectedRow.flagType]}
                  </p>
                </div>
              )}

              <div>
                <span className="text-sm text-gray-500">Parameter</span>
                <p className="text-white">{selectedRow.parameter}</p>
              </div>

              <div>
                <span className="text-sm text-gray-500">
                  {selectedRow.approvalType === "value_change"
                    ? "New Value"
                    : "Value"}
                </span>
                <p className="text-white">
                  {formatPollutantValue(
                    selectedRow.value,
                    selectedRow.parameterKey,
                  )}
                </p>
                {selectedRow.previousValue && (
                  <p className="text-xs text-gray-500 mt-1">
                    Previous:{" "}
                    {formatPollutantValue(
                      selectedRow.previousValue,
                      selectedRow.parameterKey,
                    )}
                  </p>
                )}
              </div>

              {/* Validation Type & Mode - only for value_change */}
              {selectedRow.approvalType === "value_change" && (
                <>
                  {selectedRow.validationType && (
                    <div>
                      <span className="text-sm text-gray-500">
                        Validation Type
                      </span>
                      <p className="text-white">{selectedRow.validationType}</p>
                    </div>
                  )}
                  {selectedRow.validationMode && (
                    <div>
                      <span className="text-sm text-gray-500">
                        Validation Mode
                      </span>
                      <p className="text-white">{selectedRow.validationMode}</p>
                    </div>
                  )}
                </>
              )}

              <div>
                <span className="text-sm text-gray-500">User Remarks</span>
                <p className="text-white">{selectedRow.remarks}</p>
              </div>

              <div>
                <span className="text-sm text-gray-500">Requested By</span>
                <p className="text-white">{selectedRow.requestedBy}</p>
              </div>
            </div>
          </div>

          {/* Admin Remarks */}
          <div className="space-y-2 mt-2">
            <label className="text-sm font-medium text-gray-400 mt-2">
              Admin Remarks
              <span className="text-red-400 ml-1">*</span>
            </label>
            <textarea
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
              rows={4}
              className="w-full bg-[#1a2828] text-sm border border-white/10 rounded-lg mt-2 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 resize-none"
              placeholder="Add your remarks here..."
            />
            {adminRemarks.length > 0 && adminRemarks.length < 10 && (
              <p className="text-xs text-red-400">
                {10 - adminRemarks.length} more characters required for
                rejection
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={handleApprove}
            className="flex-1 bg-teal-500 text-sm hover:bg-teal-600 text-black font-medium py-3 rounded-lg transition"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            disabled={adminRemarks.length < 10}
            className={`flex-1 text-sm font-medium py-3 rounded-lg transition ${
              adminRemarks.length < 10
                ? "bg-red-600/50 text-white/50 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            Reject
          </button>
        </div>
      </div>
    </>
  );
}
