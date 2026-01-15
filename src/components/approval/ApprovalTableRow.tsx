import type { ApprovalDataRow } from "../../data/approvalData";
import {
  validationStatusColors,
  validationStatusShortLabels,
} from "../../data/validationData";
import {
  approvalTypeLabels,
  approvalTypeColors,
} from "../../data/approvalData";
import { Eye } from "lucide-react";

interface ApprovalTableRowProps {
  row: ApprovalDataRow;
  onActionClick: (row: ApprovalDataRow) => void;
}

export default function ApprovalTableRow({
  row,
  onActionClick,
}: ApprovalTableRowProps) {
  const flagColor = validationStatusColors[row.flagType];
  const flagLabel = validationStatusShortLabels[row.flagType];
  const approvalTypeLabel = approvalTypeLabels[row.approvalType];
  const approvalTypeColor = approvalTypeColors[row.approvalType];

  // Status color and label mapping
  const getStatusColor = () => {
    switch (row.status) {
      case "pending":
        return "text-yellow-400";
      case "approved":
        return "text-green-400";
      case "rejected":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusLabel = () => {
    switch (row.status) {
      case "pending":
        return "Pending";
      case "approved":
        return "Accepted";
      case "rejected":
        return "Rejected";
      default:
        return row.status;
    }
  };

  return (
    <tr className={`border-b border-white/5 hover:bg-white/5`}>
      <td className="px-4 py-3 border-r border-white/5">{row.time}</td>
      <td className="px-4 py-3 border-r border-white/5">{row.parameter}</td>
      <td className="px-4 py-3 border-r border-white/5">
        {row.value}
        {row.previousValue && (
          <span className="text-xs text-gray-500 ml-2">
            (was {row.previousValue})
          </span>
        )}
      </td>
      <td className="px-4 py-3 border-r border-white/5">{row.remarks}</td>
      <td className="px-4 py-3 border-r border-white/5">{row.requestedBy}</td>
      <td className="px-4 py-3 border-r border-white/5">
        <span
          className={`${flagColor} px-2.5 py-1 rounded-md text-xs font-medium text-black whitespace-nowrap inline-block`}
        >
          {flagLabel}
        </span>
      </td>
      <td className="px-4 py-3 border-r border-white/5">
        <span
          className={`${approvalTypeColor} px-2.5 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap inline-block`}
        >
          {approvalTypeLabel}
        </span>
      </td>
      <td className="px-4 py-3 border-r border-white/5">
        <span className={getStatusColor()}>{getStatusLabel()}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onActionClick(row)}
          className="bg-teal-500 hover:bg-teal-600 text-black p-2 rounded font-medium transition inline-flex items-center justify-center"
          title="Manage approval"
        >
          <Eye className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
