import api from "./api";

export type CalibrationOperation =
  | "none"
  | "multiply"
  | "divide"
  | "add"
  | "subtract";

export interface CalibrationEntry {
  parameter: string;
  operation: CalibrationOperation;
  value: number;
  updatedAt: string | null;
  isCalibrated: boolean;
}

/**
 * Get calibration (operation + value) for every parameter of a device.
 * Uncalibrated parameters come back as operation "none".
 */
export const getCalibration = async (
  deviceId: string,
): Promise<CalibrationEntry[]> => {
  const response = await api.get("/calibration", { params: { deviceId } });
  return response.data.data;
};

/**
 * Update one parameter's calibration.
 */
export const updateCalibration = async (params: {
  deviceId: string;
  parameter: string;
  operation: CalibrationOperation;
  value: number;
}) => {
  const response = await api.put("/calibration", params);
  return response.data.data;
};
