import type { ValidationDataRow } from "../../data/validationData";
import StatusCell from "./StatusCell";

interface ValidationTableRowProps {
  row: ValidationDataRow;
  selectedCells: Set<string>;
  onCellClick: (rowId: string, parameter: string) => void;
}

export default function ValidationTableRow({
  row,
  selectedCells,
  onCellClick,
}: ValidationTableRowProps) {
  return (
    <tr className="border-b border-slate-200 hover:bg-slate-100">
      <td className="px-4 py-3 border-r border-slate-200">{row.time}</td>
      <td className="px-4 py-3 border-r border-slate-200">{row.location}</td>
      <StatusCell
        rowId={row.id}
        parameter="ph"
        value={row.ph}
        status={row.phStatus}
        validatedByHuman={row.phValidatedByHuman}
        flaggedByHuman={row.phFlaggedByHuman}
        pendingAdminApproval={row.phPendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="do"
        value={row.do}
        status={row.doStatus}
        validatedByHuman={row.doValidatedByHuman}
        flaggedByHuman={row.doFlaggedByHuman}
        pendingAdminApproval={row.doPendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="nh3n"
        value={row.nh3n}
        status={row.nh3nStatus}
        validatedByHuman={row.nh3nValidatedByHuman}
        flaggedByHuman={row.nh3nFlaggedByHuman}
        pendingAdminApproval={row.nh3nPendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="cod"
        value={row.cod}
        status={row.codStatus}
        validatedByHuman={row.codValidatedByHuman}
        flaggedByHuman={row.codFlaggedByHuman}
        pendingAdminApproval={row.codPendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="bod"
        value={row.bod}
        status={row.bodStatus}
        validatedByHuman={row.bodValidatedByHuman}
        flaggedByHuman={row.bodFlaggedByHuman}
        pendingAdminApproval={row.bodPendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="tss"
        value={row.tss}
        status={row.tssStatus}
        validatedByHuman={row.tssValidatedByHuman}
        flaggedByHuman={row.tssFlaggedByHuman}
        pendingAdminApproval={row.tssPendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="temperature"
        value={row.temperature}
        status={row.temperatureStatus}
        validatedByHuman={row.temperatureValidatedByHuman}
        flaggedByHuman={row.temperatureFlaggedByHuman}
        pendingAdminApproval={row.temperaturePendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="depth"
        value={row.depth}
        status={row.depthStatus}
        validatedByHuman={row.depthValidatedByHuman}
        flaggedByHuman={row.depthFlaggedByHuman}
        pendingAdminApproval={row.depthPendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
    </tr>
  );
}
