import type { ApprovalDataRow } from "../../data/approvalData";
import ApprovalTableRow from "./ApprovalTableRow";

interface ApprovalTableProps {
  data: ApprovalDataRow[];
  onActionClick: (row: ApprovalDataRow) => void;
}

export default function ApprovalTable({
  data,
  onActionClick,
}: ApprovalTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-slate-800">
        <thead className="bg-[#e2e8f0] text-slate-700 text-sm">
          <tr>
            <th className="px-4 py-3 text-left border-r border-slate-200">
              Time & Date
            </th>
            <th className="px-4 py-3 text-left border-r border-slate-200">
              Parameter
            </th>
            <th className="px-4 py-3 text-left border-r border-slate-200">
              Value
            </th>
            <th className="px-4 py-3 text-left border-r border-slate-200">
              Remarks
            </th>
            <th className="px-4 py-3 text-left border-r border-slate-200">
              Requested By
            </th>
            <th className="px-4 py-3 text-left border-r border-slate-200">
              Flag
            </th>
            <th className="px-4 py-3 text-left border-r border-slate-200">
              Action Type
            </th>
            <th className="px-4 py-3 text-left border-r border-slate-200">
              Status
            </th>
            <th className="px-4 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="bg-[#ffffff]">
          {data.map((row) => (
            <ApprovalTableRow
              key={row.id}
              row={row}
              onActionClick={onActionClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
