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
      <table className="w-full text-sm text-white">
        <thead className="bg-[#1a2828] text-gray-300 text-sm">
          <tr>
            <th className="px-4 py-3 text-left border-r border-white/5">
              Time & Date
            </th>
            <th className="px-4 py-3 text-left border-r border-white/5">
              Parameter
            </th>
            <th className="px-4 py-3 text-left border-r border-white/5">
              Value
            </th>
            <th className="px-4 py-3 text-left border-r border-white/5">
              Remarks
            </th>
            <th className="px-4 py-3 text-left border-r border-white/5">
              Requested By
            </th>
            <th className="px-4 py-3 text-left border-r border-white/5">
              Flag
            </th>
            <th className="px-4 py-3 text-left border-r border-white/5">
              Action Type
            </th>
            <th className="px-4 py-3 text-left border-r border-white/5">
              Status
            </th>
            <th className="px-4 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="bg-[#0d1616]">
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
