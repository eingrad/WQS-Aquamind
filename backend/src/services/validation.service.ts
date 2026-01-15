import { PrismaClient } from "@prisma/client";
import { getTimeSeriesData } from "./telemetry/operations/aggregation";

const prisma = new PrismaClient();

export interface ValidationRecord {
  recordId: string;
  deviceId: string;
  deviceName: string;
  location: string;
  timestamp: string;
  parameters: Record<string, any>;
  dataQuality: string;
}

/**
 * Get 1-hour aggregated validation table data
 * Returns hourly averages validated against Malaysia regulatory standards
 */
export const getValidationTableData = async (options: {
  deviceId: string;
  startDate: Date;
  endDate: Date;
  page?: number;
  limit?: number;
}) => {
  const { deviceId, startDate, endDate, page = 1, limit = 100 } = options;

  // Get device info
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    select: { name: true, location: true },
  });

  if (!device) {
    throw new Error(`Device ${deviceId} not found`);
  }

  // Get 1-hour aggregated data with validation
  const aggregated = await getTimeSeriesData({
    deviceId,
    startDate,
    endDate,
    interval: "1h",
    parameters:
      "so2,h2s,no2,btex,windSpeed,windDirection,temperature,humidity,pressure,solar,rain",
  });

  // Apply pagination
  const total = aggregated.length;
  const start = (page - 1) * limit;
  const paginatedData = aggregated.slice(start, start + limit);

  // Transform to validation table format
  const records: ValidationRecord[] = paginatedData.map((row: any) => ({
    recordId: `hourly-${row.bucket}`,
    timestamp: row.bucket,
    deviceId,
    deviceName: device.name,
    location: device.location,
    parameters: {
      so2: {
        value: row.so2_avg !== null ? Number(row.so2_avg) : null,
        unit: "ppm",
        autoFlag: row.validation_flags?.so2 || "valid",
        humanValidation: null,
      },
      h2s: {
        value: row.h2s_avg !== null ? Number(row.h2s_avg) : null,
        unit: "ppm",
        autoFlag: row.validation_flags?.h2s || "valid",
        humanValidation: null,
      },
      no2: {
        value: row.no2_avg !== null ? Number(row.no2_avg) : null,
        unit: "ppm",
        autoFlag: row.validation_flags?.no2 || "valid",
        humanValidation: null,
      },
      btex: {
        value: row.btex_avg !== null ? Number(row.btex_avg) : null,
        unit: "ppb",
        autoFlag: row.validation_flags?.btex || "valid",
        humanValidation: null,
      },
      windSpeed: {
        value: row.windspeed_avg !== null ? Number(row.windspeed_avg) : null,
        unit: "m/s",
        autoFlag: row.validation_flags?.windSpeed || "valid",
        humanValidation: null,
      },
      windDirection: {
        value:
          row.winddirection_avg !== null ? Number(row.winddirection_avg) : null,
        unit: "°",
        autoFlag: row.validation_flags?.windDirection || "valid",
        humanValidation: null,
      },
      temperature: {
        value:
          row.temperature_avg !== null ? Number(row.temperature_avg) : null,
        unit: "°C",
        autoFlag: row.validation_flags?.temperature || "valid",
        humanValidation: null,
      },
      humidity: {
        value: row.humidity_avg !== null ? Number(row.humidity_avg) : null,
        unit: "%",
        autoFlag: row.validation_flags?.humidity || "valid",
        humanValidation: null,
      },
      pressure: {
        value: row.pressure_avg !== null ? Number(row.pressure_avg) : null,
        unit: "hPa",
        autoFlag: row.validation_flags?.pressure || "valid",
        humanValidation: null,
      },
      solar: {
        value: row.solar_avg !== null ? Number(row.solar_avg) : null,
        unit: "W/m²",
        autoFlag: row.validation_flags?.solar || "valid",
        humanValidation: null,
      },
      rain: {
        value: row.rain_avg !== null ? Number(row.rain_avg) : null,
        unit: "mm",
        autoFlag: row.validation_flags?.rain || "valid",
        humanValidation: null,
      },
    },
    dataQuality: row.data_quality || "valid",
  }));

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export default {
  getValidationTableData,
};

// Force reload: 01/14/2026 12:28:12
