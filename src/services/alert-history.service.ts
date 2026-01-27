import api from "./api";

// Types
export interface AlertHistory {
  id: string;
  thresholdId: string;
  deviceId: string;
  parameter: string;
  recordId?: string;
  observedAt: string;
  actualValue: number;
  thresholdValue: number;
  thresholdType: "warning" | "critical" | "emergency";
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
  threshold: {
    parameter: string;
    thresholdType: string;
    operator: string;
    value: number;
  };
  device: {
    id: string;
    deviceCode: string;
    name: string;
    location: string;
  };
  acknowledger?: {
    id: string;
    fullName: string;
    email: string;
  };
}

/**
 * Get alert history with optional filtering
 */
export const getAlertHistory = async (filters?: {
  deviceId?: string;
  parameter?: string;
  thresholdType?: string;
  acknowledged?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.deviceId) params.append("deviceId", filters.deviceId);
  if (filters?.parameter) params.append("parameter", filters.parameter);
  if (filters?.thresholdType)
    params.append("thresholdType", filters.thresholdType);
  if (filters?.acknowledged !== undefined)
    params.append("acknowledged", filters.acknowledged.toString());
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.limit) params.append("limit", filters.limit.toString());

  const response = await api.get(`/alerts/history?${params.toString()}`);
  return response.data.data as AlertHistory[];
};

/**
 * Get single alert by ID
 */
export const getAlertById = async (id: string) => {
  const response = await api.get(`/alerts/history/${id}`);
  return response.data.data as AlertHistory;
};

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = async (id: string) => {
  const response = await api.patch(`/alerts/history/${id}/acknowledge`);
  return response.data.data as AlertHistory;
};
