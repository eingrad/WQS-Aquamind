import { Check, Flag, User } from "lucide-react";
import type { ValidationStatus } from "../../data/validationData";
import {
  validationStatusColors,
  validationStatusBgTransparent,
  validationStatusTextColors,
} from "../../data/validationData";
import { formatPollutantValue } from "../../utils/numberFormat";
import { useUnits } from "../../context/UnitContext";

interface HumanValidation {
  status: string;
  flaggedBy: {
    name: string;
    email: string;
  };
  flaggedAt: string;
  remarks: string | null;
  coverage: string;
}

interface StatusCellProps {
  rowId: string;
  parameter: string;
  value: number | null;
  status: ValidationStatus;
  validatedByHuman?: boolean;
  flaggedByHuman?: boolean;
  pendingAdminApproval?: boolean;
  humanValidation?: HumanValidation | null;
  selectedCells: Set<string>;
  onCellClick: (rowId: string, parameter: string) => void;
}

export default function StatusCell({
  rowId,
  parameter,
  value,
  status,
  validatedByHuman,
  pendingAdminApproval,
  humanValidation,
  selectedCells,
  onCellClick,
}: StatusCellProps) {
  const bgColor = validationStatusColors[status];
  const bgTransparent = validationStatusBgTransparent[status];
  const textColor = validationStatusTextColors[status];
  const cellKey = `${rowId}:${parameter}`;
  const isSelected = selectedCells.has(cellKey);

  // Convert the stored value (backend base unit) into the user's chosen
  // display unit so values track the unit shown in the column header.
  const { convert } = useUnits();
  const displayValue =
    typeof value === "number" ? convert(value, parameter) : value;

  const handleClick = () => {
    // Allow selection of all cells except "no_data"
    if (status !== "no_data") {
      onCellClick(rowId, parameter);
    }
  };

  // Build tooltip text for human validation
  const getTooltipText = (): string => {
    if (!humanValidation) return "";

    const date = new Date(humanValidation.flaggedAt);
    const formattedDate = date.toLocaleString();

    let tooltip = `Flagged by ${humanValidation.flaggedBy.name}\n`;
    tooltip += `On: ${formattedDate}\n`;
    tooltip += `Coverage: ${humanValidation.coverage}\n`;
    if (humanValidation.remarks) {
      tooltip += `\nRemarks:\n${humanValidation.remarks}`;
    }
    return tooltip;
  };

  if (value === null) {
    return (
      <td className="w-[10%] px-4 py-3 text-center border-r border-slate-200">
        <div className={`${bgColor} px-3 py-2 rounded`}>&nbsp;</div>
      </td>
    );
  }

  // Cell is clickable for all statuses except no_data
  const isClickable = status !== "no_data";

  // Determine which icon to show (priority: pending > human flag > validated)
  const showIcon = pendingAdminApproval || humanValidation || validatedByHuman;
  const iconBgColor = pendingAdminApproval
    ? "bg-gray-500"
    : humanValidation
      ? "bg-orange-600"
      : "bg-green-600";

  return (
    <td className="w-[10%] px-4 py-3 text-center border-r border-slate-200">
      <div
        className={`${bgTransparent} px-3 py-2 rounded ${textColor} relative ${
          isClickable ? "cursor-pointer hover:ring-1 hover:ring-blue-100" : ""
        } ${isSelected ? "ring-2 ring-blue-100" : ""}`}
        onClick={handleClick}
        title={humanValidation ? getTooltipText() : undefined}
      >
        {typeof displayValue === "number"
          ? formatPollutantValue(displayValue, parameter)
          : displayValue}

        {/* Show icon badge */}
        {showIcon && (
          <div
            className={`absolute -top-1 -right-1 ${iconBgColor} rounded-full p-0.5`}
            title={
              pendingAdminApproval
                ? "Pending Admin Approval"
                : humanValidation
                  ? getTooltipText()
                  : "Validated by Human"
            }
          >
            {pendingAdminApproval ? (
              <Flag className="w-5 h-3 text-slate-800" />
            ) : humanValidation ? (
              <User className="w-5 h-3 text-slate-800" />
            ) : (
              <Check className="w-5 h-3 text-slate-800" />
            )}
          </div>
        )}
      </div>
    </td>
  );
}
