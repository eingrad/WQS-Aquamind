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
  ph: number | null;
  phStatus: ValidationStatus;
  phValidatedByHuman?: boolean;
  phFlaggedByHuman?: boolean;
  phPendingAdminApproval?: boolean;
  do: number | null;
  doStatus: ValidationStatus;
  doValidatedByHuman?: boolean;
  doFlaggedByHuman?: boolean;
  doPendingAdminApproval?: boolean;
  nh3n: number | null;
  nh3nStatus: ValidationStatus;
  nh3nValidatedByHuman?: boolean;
  nh3nFlaggedByHuman?: boolean;
  nh3nPendingAdminApproval?: boolean;
  cod: number | null;
  codStatus: ValidationStatus;
  codValidatedByHuman?: boolean;
  codFlaggedByHuman?: boolean;
  codPendingAdminApproval?: boolean;
  bod: number | null;
  bodStatus: ValidationStatus;
  bodValidatedByHuman?: boolean;
  bodFlaggedByHuman?: boolean;
  bodPendingAdminApproval?: boolean;
  tss: number | null;
  tssStatus: ValidationStatus;
  tssValidatedByHuman?: boolean;
  tssFlaggedByHuman?: boolean;
  tssPendingAdminApproval?: boolean;
  temperature: number | null;
  temperatureStatus: ValidationStatus;
  temperatureValidatedByHuman?: boolean;
  temperatureFlaggedByHuman?: boolean;
  temperaturePendingAdminApproval?: boolean;
  depth: number | null;
  depthStatus: ValidationStatus;
  depthValidatedByHuman?: boolean;
  depthFlaggedByHuman?: boolean;
  depthPendingAdminApproval?: boolean;
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
  no_data: "text-slate-500",
  valid: "text-green-600",
  exceeding_range: "text-[#FFD230]",
  insufficient_data: "text-orange-600",
  parameter_relation: "text-purple-600",
  out_of_range: "text-red-600",
  maintenance: "text-blue-600",
  qc_checks: "text-[#0047AB]",
  pending_validation: "text-slate-500",
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
