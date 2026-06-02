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
import { formatPollutantValue } from "../../utils/numberFormat";

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
        return "text-yellow-600";
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-slate-500";
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
    <tr className={`border-b border-slate-200 hover:bg-slate-100`}>
      <td className="px-4 py-3 border-r border-slate-200">{row.time}</td>
      <td className="px-4 py-3 border-r border-slate-200">{row.parameter}</td>
      <td className="px-4 py-3 border-r border-slate-200">
        {formatPollutantValue(row.value, row.parameterKey)}
        {row.previousValue && (
          <span className="text-xs text-gray-500 ml-2">
            (was {formatPollutantValue(row.previousValue, row.parameterKey)})
          </span>
        )}
      </td>
      <td className="px-4 py-3 border-r border-slate-200">{row.remarks}</td>
      <td className="px-4 py-3 border-r border-slate-200">{row.requestedBy}</td>
      <td className="px-4 py-3 border-r border-slate-200">
        <span
          className={`${flagColor} px-2.5 py-1 rounded-md text-xs font-medium text-black whitespace-nowrap inline-block`}
        >
          {flagLabel}
        </span>
      </td>
      <td className="px-4 py-3 border-r border-slate-200">
        <span
          className={`${approvalTypeColor} px-2.5 py-1 rounded-md text-xs font-medium text-slate-800 whitespace-nowrap inline-block`}
        >
          {approvalTypeLabel}
        </span>
      </td>
      <td className="px-4 py-3 border-r border-slate-200">
        <span className={getStatusColor()}>{getStatusLabel()}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onActionClick(row)}
          className="bg-blue-500 hover:bg-blue-600 text-black p-2 rounded font-medium transition inline-flex items-center justify-center"
          title="Manage approval"
        >
          <Eye className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
