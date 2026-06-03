import api from "./api";

export interface SensorReading {
  [key: string]: any;
  recordId: string;
  deviceId: string;
  observedAt: string;
  phValue: string | null;
  doValue: string | null;
  nh3nValue: string | null;
  codValue: string | null;
  bodValue: string | null;
  tssValue: string | null;
  tempValue: string | null;
  depthValue: string | null;
  dataQuality: string;
  device?: {
    name: string;
    deviceCode: string;
    location: string;
  };
}

export interface TimeSeriesBucket {
  bucket: string;
  ph_avg?: number;
  ph_min?: number;
  ph_max?: number;
  do_avg?: number;
  do_min?: number;
  do_max?: number;
  nh3n_avg?: number;
  cod_avg?: number;
  bod_avg?: number;
  tss_avg?: number;
  temperature_avg?: number;
  depth_avg?: number;
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
  parameters?: string; // comma-separated: ph,do,temperature
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
    | "ph"
    | "do"
    | "nh3n"
    | "cod"
    | "bod"
    | "tss"
    | "temperature"
    | "depth";
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
