import type { ValidationStatus } from "./validationData";

// Approval type: flag = flagging data with status, value_change = validating/changing data value
export type ApprovalType = "flag" | "value_change";

// Approval data interface for admin approval page
export interface ApprovalDataRow {
  id: string;
  time: string;
  parameter: string; // e.g., "H₂S", "SO₂", etc.
  parameterKey: string; // e.g., "h2s", "so2", etc.
  value: number;
  remarks: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  flagType: ValidationStatus;
  approvalType: ApprovalType; // Indicates if this is a flag approval or value change
  previousValue?: number; // For value_change type, shows the original value before change
  adminRemarks?: string;
  validationType?: "Addition" | "Multiplication" | "Constant" | "Original"; // For value_change type
  validationMode?: "Corrected" | "Estimated"; // For value_change type
  dataCapturedAt?: string; // When the telemetry data was originally captured
}

// Approval type labels and colors
export const approvalTypeLabels: Record<ApprovalType, string> = {
  flag: "Flag",
  value_change: "Validation",
};

export const approvalTypeColors: Record<ApprovalType, string> = {
  flag: "bg-blue-600",
  value_change: "bg-blue-600",
};
