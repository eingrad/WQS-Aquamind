import api from "./api";

export interface SensorReading {
  recordId: string;
  deviceId: string;
  observedAt: string;
  so2Value: string | null;
  h2sValue: string | null;
  no2Value: string | null;
  btexValue: string | null;
  tempValue: string | null;
  humidityValue: string | null;
  wsValue: string | null;
  wdValue: string | null;
  solarValue: string | null;
  dataQuality: string;
  device?: {
    name: string;
    deviceCode: string;
    location: string;
  };
}

export interface TimeSeriesBucket {
  bucket: string;
  so2_avg?: number;
  so2_min?: number;
  so2_max?: number;
  no2_avg?: number;
  no2_min?: number;
  no2_max?: number;
  h2s_avg?: number;
  btex_avg?: number;
  temperature_avg?: number;
  humidity_avg?: number;
  windSpeed_avg?: number;
  windDirection_avg?: number;
  solar_avg?: number;
  count: number;
}

/**
 * Get latest sensor readings
 */
export const getLatestReadings = async (
  deviceId?: string,
  limit: number = 24
): Promise<SensorReading[]> => {
  const params: any = { limit };
  if (deviceId) params.deviceId = deviceId;

  const response = await api.get("/sensors/readings/latest", { params });
  return response.data.data;
};

/**
 * Get time-series aggregated data for charts
 */
export const getTimeSeriesData = async (params: {
  deviceId: string;
  startDate: string;
  endDate: string;
  interval?: "raw" | "1m" | "30m" | "1h" | "8h" | "8h_ma" | "24h" | "24h_ma";
  parameters?: string; // comma-separated: so2,no2,temperature
}) => {
  const response = await api.get("/sensors/readings/time-series", { params });
  return response.data.data;
};

/**
 * Get hourly averages for a specific parameter
 */
export const getHourlyAverages = async (params: {
  deviceId: string;
  startDate: string;
  endDate: string;
  parameter:
    | "so2"
    | "h2s"
    | "no2"
    | "btex"
    | "temperature"
    | "humidity"
    | "windSpeed"
    | "windDirection"
    | "solar";
}) => {
  const response = await api.get("/sensors/readings/hourly-avg", { params });
  return response.data.data;
};

/**
 * Get sensor readings with filters
 */
export const getReadings = async (params?: {
  deviceId?: string;
  startDate?: string;
  endDate?: string;
  parameter?: string;
  dataQuality?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/sensors/readings", { params });
  return response.data.data;
};
