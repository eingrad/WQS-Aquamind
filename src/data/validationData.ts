export type ValidationStatus =
  | "no_data"
  | "valid"
  | "exceeding_range"
  | "insufficient_data"
  | "parameter_relation"
  | "out_of_range"
  | "maintenance"
  | "qc_checks"
  | "pending_validation";

export interface ValidationDataRow {
  id: string;
  time: string;
  location: string;
  so2: number | null;
  so2Status: ValidationStatus;
  so2ValidatedByHuman?: boolean;
  so2FlaggedByHuman?: boolean;
  so2PendingAdminApproval?: boolean;
  h2s: number | null;
  h2sStatus: ValidationStatus;
  h2sValidatedByHuman?: boolean;
  h2sFlaggedByHuman?: boolean;
  h2sPendingAdminApproval?: boolean;
  no2: number | null;
  no2Status: ValidationStatus;
  no2ValidatedByHuman?: boolean;
  no2FlaggedByHuman?: boolean;
  no2PendingAdminApproval?: boolean;
  // BTEX components — Synspec GC955 channels 34/35/36/37/38, all in ppb.
  // Marked optional so legacy/dev sample data without these populated still
  // type-checks; live data from the API always populates them.
  benzene?: number | null;
  benzeneStatus?: ValidationStatus;
  benzeneValidatedByHuman?: boolean;
  benzeneFlaggedByHuman?: boolean;
  benzenePendingAdminApproval?: boolean;
  toluene?: number | null;
  tolueneStatus?: ValidationStatus;
  tolueneValidatedByHuman?: boolean;
  tolueneFlaggedByHuman?: boolean;
  toluenePendingAdminApproval?: boolean;
  ethylbenzene?: number | null;
  ethylbenzeneStatus?: ValidationStatus;
  ethylbenzeneValidatedByHuman?: boolean;
  ethylbenzeneFlaggedByHuman?: boolean;
  ethylbenzenePendingAdminApproval?: boolean;
  xylenes?: number | null;
  xylenesStatus?: ValidationStatus;
  xylenesValidatedByHuman?: boolean;
  xylenesFlaggedByHuman?: boolean;
  xylenesPendingAdminApproval?: boolean;
  windSpeed: number | null;
  windSpeedStatus: ValidationStatus;
  windSpeedValidatedByHuman?: boolean;
  windSpeedFlaggedByHuman?: boolean;
  windSpeedPendingAdminApproval?: boolean;
  windDirection: number | null;
  windDirectionStatus: ValidationStatus;
  windDirectionValidatedByHuman?: boolean;
  windDirectionFlaggedByHuman?: boolean;
  windDirectionPendingAdminApproval?: boolean;
  temperature: number | null;
  temperatureStatus: ValidationStatus;
  temperatureValidatedByHuman?: boolean;
  temperatureFlaggedByHuman?: boolean;
  temperaturePendingAdminApproval?: boolean;
  humidity: number | null;
  humidityStatus: ValidationStatus;
  humidityValidatedByHuman?: boolean;
  humidityFlaggedByHuman?: boolean;
  humidityPendingAdminApproval?: boolean;
  pressure: number | null;
  pressureStatus: ValidationStatus;
  pressureValidatedByHuman?: boolean;
  pressureFlaggedByHuman?: boolean;
  pressurePendingAdminApproval?: boolean;
  rain: number | null;
  rainStatus: ValidationStatus;
  rainValidatedByHuman?: boolean;
  rainFlaggedByHuman?: boolean;
  rainPendingAdminApproval?: boolean;
  solar: number | null;
  solarStatus: ValidationStatus;
  solarValidatedByHuman?: boolean;
  solarFlaggedByHuman?: boolean;
  solarPendingAdminApproval?: boolean;
}

// Sample validation data

export const validationStatusColors: Record<ValidationStatus, string> = {
  no_data: "bg-[#636363ff]",
  valid: "bg-green-600",
  exceeding_range: "bg-[#FFD230]",
  insufficient_data: "bg-orange-600",
  parameter_relation: "bg-purple-600",
  out_of_range: "bg-red-600",
  maintenance: "bg-blue-500",
  qc_checks: "bg-[#0047AB]",
  pending_validation: "bg-gray-500",
};

// Semi-transparent backgrounds (20% opacity)
export const validationStatusBgTransparent: Record<ValidationStatus, string> = {
  no_data: "bg-[#899499]",
  valid: "bg-green-600/20",
  exceeding_range: "bg-[#FFD230]/20",
  insufficient_data: "bg-orange-600/20",
  parameter_relation: "bg-purple-600/20",
  out_of_range: "bg-red-600/20",
  maintenance: "bg-blue-500/20",
  qc_checks: "bg-[#0047AB]/20",
  pending_validation: "bg-gray-500/20",
};

export const validationStatusTextColors: Record<ValidationStatus, string> = {
  no_data: "text-gray-400",
  valid: "text-green-400",
  exceeding_range: "text-[#FFD230]",
  insufficient_data: "text-orange-400",
  parameter_relation: "text-purple-400",
  out_of_range: "text-red-400",
  maintenance: "text-blue-400",
  qc_checks: "text-[#0047AB]",
  pending_validation: "text-gray-400",
};

export const validationStatusLabels: Record<ValidationStatus, string> = {
  no_data: "No Data",
  valid: "Valid",
  exceeding_range: "Data Exceeding Analyzer's Range",
  insufficient_data: "Insufficient Data For An Hour",
  parameter_relation: "Parameter Relation",
  out_of_range: "Out of Range",
  maintenance: "Device Under Maintenance",
  qc_checks: "QC Checks",
  pending_validation: "Pending Admin Approval",
};

// Short labels for compact badge display
export const validationStatusShortLabels: Record<ValidationStatus, string> = {
  no_data: "No Data",
  valid: "Valid",
  exceeding_range: "Exceeding Range",
  insufficient_data: "Insufficient Data",
  parameter_relation: "Param Relation",
  out_of_range: "Out of Range",
  maintenance: "Maintenance",
  qc_checks: "QC Checks",
  pending_validation: "Pending",
};
