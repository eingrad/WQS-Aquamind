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
    <tr className="border-b border-white/5 hover:bg-white/5">
      <td className="px-4 py-3 border-r border-white/5">{row.time}</td>
      <td className="px-4 py-3 border-r border-white/5">{row.location}</td>
      <StatusCell
        rowId={row.id}
        parameter="so2"
        value={row.so2}
        status={row.so2Status}
        validatedByHuman={row.so2ValidatedByHuman}
        flaggedByHuman={row.so2FlaggedByHuman}
        pendingAdminApproval={row.so2PendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="h2s"
        value={row.h2s}
        status={row.h2sStatus}
        validatedByHuman={row.h2sValidatedByHuman}
        flaggedByHuman={row.h2sFlaggedByHuman}
        pendingAdminApproval={row.h2sPendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="no2"
        value={row.no2}
        status={row.no2Status}
        validatedByHuman={row.no2ValidatedByHuman}
        flaggedByHuman={row.no2FlaggedByHuman}
        pendingAdminApproval={row.no2PendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="benzene"
        value={row.benzene ?? null}
        status={row.benzeneStatus ?? "no_data"}
        validatedByHuman={row.benzeneValidatedByHuman}
        flaggedByHuman={row.benzeneFlaggedByHuman}
        pendingAdminApproval={row.benzenePendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="toluene"
        value={row.toluene ?? null}
        status={row.tolueneStatus ?? "no_data"}
        validatedByHuman={row.tolueneValidatedByHuman}
        flaggedByHuman={row.tolueneFlaggedByHuman}
        pendingAdminApproval={row.toluenePendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="ethylbenzene"
        value={row.ethylbenzene ?? null}
        status={row.ethylbenzeneStatus ?? "no_data"}
        validatedByHuman={row.ethylbenzeneValidatedByHuman}
        flaggedByHuman={row.ethylbenzeneFlaggedByHuman}
        pendingAdminApproval={row.ethylbenzenePendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="mp_xylene"
        value={row.mpXylene ?? null}
        status={row.mpXyleneStatus ?? "no_data"}
        validatedByHuman={row.mpXyleneValidatedByHuman}
        flaggedByHuman={row.mpXyleneFlaggedByHuman}
        pendingAdminApproval={row.mpXylenePendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="o_xylene"
        value={row.oXylene ?? null}
        status={row.oXyleneStatus ?? "no_data"}
        validatedByHuman={row.oXyleneValidatedByHuman}
        flaggedByHuman={row.oXyleneFlaggedByHuman}
        pendingAdminApproval={row.oXylenePendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="windSpeed"
        value={row.windSpeed}
        status={row.windSpeedStatus}
        validatedByHuman={row.windSpeedValidatedByHuman}
        flaggedByHuman={row.windSpeedFlaggedByHuman}
        pendingAdminApproval={row.windSpeedPendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="windDirection"
        value={row.windDirection}
        status={row.windDirectionStatus}
        validatedByHuman={row.windDirectionValidatedByHuman}
        flaggedByHuman={row.windDirectionFlaggedByHuman}
        pendingAdminApproval={row.windDirectionPendingAdminApproval}
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
        parameter="humidity"
        value={row.humidity}
        status={row.humidityStatus}
        validatedByHuman={row.humidityValidatedByHuman}
        flaggedByHuman={row.humidityFlaggedByHuman}
        pendingAdminApproval={row.humidityPendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="pressure"
        value={row.pressure}
        status={row.pressureStatus}
        validatedByHuman={row.pressureValidatedByHuman}
        flaggedByHuman={row.pressureFlaggedByHuman}
        pendingAdminApproval={row.pressurePendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="rain"
        value={row.rain}
        status={row.rainStatus}
        validatedByHuman={row.rainValidatedByHuman}
        flaggedByHuman={row.rainFlaggedByHuman}
        pendingAdminApproval={row.rainPendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
      <StatusCell
        rowId={row.id}
        parameter="radiation"
        value={row.radiation}
        status={row.radiationStatus}
        validatedByHuman={row.radiationValidatedByHuman}
        flaggedByHuman={row.radiationFlaggedByHuman}
        pendingAdminApproval={row.radiationPendingAdminApproval}
        selectedCells={selectedCells}
        onCellClick={onCellClick}
      />
    </tr>
  );
}
