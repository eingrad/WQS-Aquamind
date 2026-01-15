import api from "./api";

/**
 * Check if device is currently active (sent data in last 3 hours)
 */
export const getDeviceStatus = async (deviceId: string) => {
  const response = await api.get(`/sensors/device-status?deviceId=${deviceId}`);
  return response.data.data;
};
