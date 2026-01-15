import api from "./api";

export interface Device {
  id: string;
  deviceCode: string;
  name: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all devices
 */
export const getDevices = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  const response = await api.get("/devices", { params });
  return response.data.data;
};

/**
 * Get device by ID
 */
export const getDeviceById = async (id: string): Promise<Device> => {
  const response = await api.get(`/devices/${id}`);
  return response.data.data;
};

/**
 * Get device statistics
 */
export const getDeviceStats = async () => {
  const response = await api.get("/devices/stats");
  return response.data.data;
};
