import api from "./api";

/**
 * Live Data Service
 * Handles real-time polling of sensor readings from Redis cache
 */

export interface RealtimeReading {
  value: number;
  at: string; // ISO timestamp of when this parameter was last updated
}

export interface RealTimeParamsData {
  timestamp: string;
  deviceId: string;
  readings: Record<string, RealtimeReading>;
}

/**
 * Fetch latest real-time sensor readings
 * @param deviceId - Device UUID
 * @returns Latest readings from Redis (pushed by MQTT subscriber every minute)
 */
export const getRealTimeParams = async (
  deviceId: string,
): Promise<RealTimeParamsData> => {
  const response = await api.get(`/live/realtime-params`, {
    params: { deviceId },
  });
  return response.data.data;
};
