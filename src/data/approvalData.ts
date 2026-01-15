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
}

// Approval type labels and colors
export const approvalTypeLabels: Record<ApprovalType, string> = {
  flag: "Flag",
  value_change: "Validation",
};

export const approvalTypeColors: Record<ApprovalType, string> = {
  flag: "bg-teal-600",
  value_change: "bg-teal-600",
};

// Sample approval data
export const approvalData: ApprovalDataRow[] = [
  {
    id: "appr-1",
    time: "21:00, 03/10/25",
    parameter: "H₂S",
    parameterKey: "h2s",
    value: 1.09,
    remarks: "Out of Range",
    status: "pending",
    requestedBy: "Admin",
    flagType: "out_of_range",
    approvalType: "flag",
  },
  {
    id: "appr-2",
    time: "21:00, 03/10/25",
    parameter: "H₂S",
    parameterKey: "h2s",
    value: 38.5,
    previousValue: 35.0,
    remarks: "Value corrected after calibration",
    status: "pending",
    requestedBy: "User1",
    flagType: "valid",
    approvalType: "value_change",
    validationType: "Addition",
    validationMode: "Corrected",
  },
  {
    id: "appr-3",
    time: "21:00, 03/10/25",
    parameter: "SO₂",
    parameterKey: "so2",
    value: 1.09,
    remarks: "Out of Range",
    status: "pending",
    requestedBy: "Admin",
    flagType: "out_of_range",
    approvalType: "flag",
  },
  {
    id: "appr-4",
    time: "20:30, 03/10/25",
    parameter: "Temperature",
    parameterKey: "temperature",
    value: 22.5,
    previousValue: 20.35,
    remarks: "Recalibrated sensor reading",
    status: "pending",
    requestedBy: "User2",
    flagType: "valid",
    approvalType: "value_change",
    validationType: "Multiplication",
    validationMode: "Estimated",
  },
  {
    id: "appr-5",
    time: "21:00, 03/10/25",
    parameter: "NO₂",
    parameterKey: "no2",
    value: 1.09,
    remarks: "Insufficient Data",
    status: "pending",
    requestedBy: "Admin",
    flagType: "insufficient_data",
    approvalType: "flag",
  },
  {
    id: "appr-6",
    time: "19:45, 03/10/25",
    parameter: "Wind Speed",
    parameterKey: "windSpeed",
    value: 82.5,
    previousValue: 85.73,
    remarks: "Adjusted for sensor drift",
    status: "pending",
    requestedBy: "User1",
    flagType: "valid",
    approvalType: "value_change",
    validationType: "Constant",
    validationMode: "Corrected",
  },
  {
    id: "appr-7",
    time: "21:00, 03/10/25",
    parameter: "BTEX",
    parameterKey: "btex",
    value: 1.09,
    remarks: "Parameter Relation",
    status: "pending",
    requestedBy: "Admin",
    flagType: "parameter_relation",
    approvalType: "flag",
  },
  {
    id: "appr-8",
    time: "20:00, 03/10/25",
    parameter: "SO₂",
    parameterKey: "so2",
    value: 320.5,
    remarks: "Exceeding analyzer range",
    status: "pending",
    requestedBy: "Admin",
    flagType: "exceeding_range",
    approvalType: "flag",
  },
  {
    id: "appr-9",
    time: "19:00, 03/10/25",
    parameter: "Humidity",
    parameterKey: "humidity",
    value: 12.8,
    previousValue: 10.15,
    remarks: "Updated based on manual reading",
    status: "pending",
    requestedBy: "User2",
    flagType: "valid",
    approvalType: "value_change",
    validationType: "Original",
    validationMode: "Estimated",
  },
  {
    id: "appr-10",
    time: "18:00, 03/10/25",
    parameter: "Wind Direction",
    parameterKey: "windDirection",
    value: 80.45,
    remarks: "QC checks failed",
    status: "pending",
    requestedBy: "Admin",
    flagType: "qc_checks",
    approvalType: "flag",
  },
];
