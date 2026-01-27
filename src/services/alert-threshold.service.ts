import api from "./api";

// Types
export interface AlertThreshold {
  id: string;
  deviceId?: string;
  parameter: string;
  thresholdType: "warning" | "critical" | "emergency";
  operator: ">" | "<" | ">=" | "<=" | "==";
  value: number;
  enabled: boolean;
  cooldownMinutes: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  device?: {
    id: string;
    deviceCode: string;
    name: string;
    location: string;
  };
  creator: {
    fullName: string;
    email: string;
  };
}

export interface CreateThresholdData {
  deviceId?: string;
  parameter: string;
  thresholdType: "warning" | "critical" | "emergency";
  operator: ">" | "<" | ">=" | "<=" | "==";
  value: number;
  cooldownMinutes?: number;
}

export interface UpdateThresholdData {
  deviceId?: string;
  parameter?: string;
  thresholdType?: "warning" | "critical" | "emergency";
  operator?: ">" | "<" | ">=" | "<=" | "==";
  value?: number;
  cooldownMinutes?: number;
}

/**
 * Get all thresholds with optional filtering
 */
export const getThresholds = async (filters?: {
  deviceId?: string;
  parameter?: string;
  enabled?: boolean;
}) => {
  const params = new URLSearchParams();
  if (filters?.deviceId) params.append("deviceId", filters.deviceId);
  if (filters?.parameter) params.append("parameter", filters.parameter);
  if (filters?.enabled !== undefined)
    params.append("enabled", filters.enabled.toString());

  const response = await api.get(`/alerts/thresholds?${params.toString()}`);
  return response.data.data as AlertThreshold[];
};

/**
 * Get single threshold by ID
 */
export const getThresholdById = async (id: string) => {
  const response = await api.get(`/alerts/thresholds/${id}`);
  return response.data.data as AlertThreshold;
};

/**
 * Create new threshold
 */
export const createThreshold = async (data: CreateThresholdData) => {
  const response = await api.post("/alerts/thresholds", data);
  return response.data.data as AlertThreshold;
};

/**
 * Update threshold
 */
export const updateThreshold = async (
  id: string,
  data: UpdateThresholdData,
) => {
  const response = await api.put(`/alerts/thresholds/${id}`, data);
  return response.data.data as AlertThreshold;
};

/**
 * Delete threshold
 */
export const deleteThreshold = async (id: string) => {
  const response = await api.delete(`/alerts/thresholds/${id}`);
  return response.data;
};

/**
 * Toggle threshold enabled/disabled
 */
export const toggleThreshold = async (id: string, enabled: boolean) => {
  const response = await api.patch(`/alerts/thresholds/${id}/toggle`, {
    enabled,
  });
  return response.data.data as AlertThreshold;
};
