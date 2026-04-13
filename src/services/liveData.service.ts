import api from "./api";

/**
 * Live Data Service
 * Handles real-time polling of wind rose and pollution rose data
 * Data updates every 10 seconds
 */

export interface WindRoseData {
  timestamp: string;
  deviceId: string;
  directions: {
    [direction: string]: {
      [speedBin: string]: number;
    };
  };
}

export interface PollutionRoseData {
  timestamp: string;
  deviceId: string;
  parameter: string;
  directions: {
    [direction: string]: {
      [concentrationBin: string]: number;
    };
  };
}

/**
 * Fetch current wind rose data
 * @param deviceId - Device UUID
 * @returns Wind rose data for all 16 directions with speed bins
 */
export const getWindRoseData = async (
  deviceId: string
): Promise<WindRoseData> => {
  const response = await api.get(`/live/wind-rose`, {
    params: { deviceId },
  });
  return response.data.data;
};

/**
 * Fetch current pollution rose data
 * @param deviceId - Device UUID
 * @param parameter - Pollutant parameter (SO2, H2S, NO2, BTEX)
 * @returns Pollution rose data for all 16 directions with concentration bins
 */
export const getPollutionRoseData = async (
  deviceId: string,
  parameter: string = "SO2"
): Promise<PollutionRoseData> => {
  const response = await api.get(`/live/pollution-rose`, {
    params: { deviceId, parameter },
  });
  return response.data.data;
};

export interface RealTimeParamsData {
  timestamp: string;
  deviceId: string;
  readings: Record<string, number>;
}

/**
 * Fetch latest real-time sensor readings
 * @param deviceId - Device UUID
 * @returns Latest readings from Redis (pushed by MQTT subscriber every 5-10s)
 */
export const getRealTimeParams = async (
  deviceId: string
): Promise<RealTimeParamsData> => {
  const response = await api.get(`/live/realtime-params`, {
    params: { deviceId },
  });
  return response.data.data;
};
