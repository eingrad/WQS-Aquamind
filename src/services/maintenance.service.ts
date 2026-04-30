import api from "./api";

export interface MaintenanceDevice {
  id: string;
  deviceCode: string;
  name: string;
  location: string;
}

export interface MaintenanceLog {
  id: string;
  deviceId: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
  description?: string | null;
  performedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  device?: MaintenanceDevice;
}

export interface CreateMaintenanceInput {
  startTime: string;
  endTime: string;
  reason?: string;
  description?: string;
}

export const getAllMaintenance = async (limit = 200) => {
  const response = await api.get(`/maintenance?limit=${limit}`);
  return response.data.data as MaintenanceLog[];
};

export const getDeviceMaintenance = async (deviceId: string, limit = 50) => {
  const response = await api.get(
    `/devices/${deviceId}/maintenance?limit=${limit}`
  );
  return response.data.data as MaintenanceLog[];
};

export const getActiveMaintenance = async (deviceId: string) => {
  const response = await api.get(`/devices/${deviceId}/maintenance/active`);
  return response.data.data as MaintenanceLog | null;
};

export const createMaintenance = async (
  deviceId: string,
  data: CreateMaintenanceInput
) => {
  const response = await api.post(
    `/devices/${deviceId}/maintenance`,
    data
  );
  return response.data.data as MaintenanceLog;
};

export const endMaintenanceEarly = async (logId: string) => {
  const response = await api.patch(`/maintenance/${logId}/end`);
  return response.data.data as MaintenanceLog;
};

export const deleteMaintenance = async (logId: string) => {
  const response = await api.delete(`/maintenance/${logId}`);
  return response.data;
};
