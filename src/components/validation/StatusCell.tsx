import { Check, Flag, Clock } from "lucide-react";
import type { ValidationStatus } from "../../data/validationData";
import {
  validationStatusColors,
  validationStatusBgTransparent,
  validationStatusTextColors,
} from "../../data/validationData";

interface StatusCellProps {
  rowId: string;
  parameter: string;
  value: number | null;
  status: ValidationStatus;
  validatedByHuman?: boolean;
  flaggedByHuman?: boolean;
  pendingAdminApproval?: boolean;
  selectedCells: Set<string>;
  onCellClick: (rowId: string, parameter: string) => void;
}

export default function StatusCell({
  rowId,
  parameter,
  value,
  status,
  validatedByHuman,
  flaggedByHuman,
  pendingAdminApproval,
  selectedCells,
  onCellClick,
}: StatusCellProps) {
  const bgColor = validationStatusColors[status];
  const bgTransparent = validationStatusBgTransparent[status];
  const textColor = validationStatusTextColors[status];
  const cellKey = `${rowId}:${parameter}`;
  const isSelected = selectedCells.has(cellKey);

  const handleClick = () => {
    // Allow selection of all cells except "no_data"
    if (status !== "no_data") {
      onCellClick(rowId, parameter);
    }
  };

  if (value === null) {
    return (
      <td className="w-[10%] px-4 py-3 text-center border-r border-white/5">
        <div className={`${bgColor} px-3 py-2 rounded`}>&nbsp;</div>
      </td>
    );
  }

  // Cell is clickable for all statuses except no_data
  const isClickable = status !== "no_data";

  return (
    <td className="w-[10%] px-4 py-3 text-center border-r border-white/5">
      <div
        className={`${bgTransparent} px-3 py-2 rounded ${textColor} relative ${
          isClickable ? "cursor-pointer hover:ring-1 hover:ring-teal-100" : ""
        } ${isSelected ? "ring-2 ring-teal-100" : ""}`}
        onClick={handleClick}
      >
        {value}
        {/* Show pending clock icon when awaiting admin approval */}
        {pendingAdminApproval && (
          <div
            className="absolute -top-1 -right-1 bg-gray-500 rounded-full p-0.5"
            title="Pending Admin Approval"
          >
            <Clock className="w-3 h-3 text-white" />
          </div>
        )}
        {/* Show validated check icon only when not pending */}
        {validatedByHuman && !pendingAdminApproval && (
          <div
            className="absolute -top-1 -right-1 bg-green-600 rounded-full p-0.5"
            title="Validated by Human"
          >
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        {flaggedByHuman && (
          <div
            className="absolute -top-1 -right-1 bg-orange-600 rounded-full p-0.5"
            title="Flagged by Human"
          >
            <Flag className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </td>
  );
}
