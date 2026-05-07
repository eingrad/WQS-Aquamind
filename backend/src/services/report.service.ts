import prisma from "../config/database";
import { getTimeSeriesData } from "./telemetry.service";
import { getDeviceById } from "./device.service";
import { convertValue, resolveUnit } from "../utils/unit-conversion";
import {
  expectedReadingsForInterval,
} from "./telemetry/aggregation/parameter-cadence";

export interface ReportOptions {
  deviceId: string;
  startDate: Date;
  endDate: Date;
  frequency: "daily" | "weekly" | "monthly";
  parameters?: string[];
  /**
   * Optional per-parameter unit preferences supplied by the caller (the
   * dashboard sends the user's selected units so the report matches what
   * they see on screen). Example: { so2: "ppm", temperature: "°F" }
   */
  units?: Record<string, string>;
}

export interface ReportData {
  deviceId: string;
  deviceName: string;
  location: string;
  dateRange: string;
  generatedOn: string;
  frequency: string;
  parameters: Array<{
    key: string;
    label: string;
    unit: string;
  }>;
  data: Array<Record<string, any>>;
  summary: {
    maxTemp: number | null;
    minWind: number | null;
    avgSO2: number | null;
    avgH2S: number | null;
    avgNO2: number | null;
    // BTEX components — Synspec GC955 (ppb)
    avgBenzene: number | null;
    avgToluene: number | null;
    avgEthylbenzene: number | null;
    avgXylenes: number | null;
    avgSolar: number | null;
    availability: {
      [parameter: string]: number; // percentage 0-100
    };
    incompletePeriods: {
      [parameter: string]: Array<{ date: string; percentage: number }>; // List of incomplete days/hours
    };
    maintenanceExcluded: number; // count of buckets excluded as maintenance
    /**
     * Per-parameter data point counts at 1-hour granularity, used for the
     * "Data Counts" table in the PDF. Counts are always hour-based regardless
     * of report frequency: daily = 24, weekly = 168, monthly = 24 × N days.
     */
    dataCounts: {
      [parameter: string]: {
        total: number;
        available: number;
        validated: number;
        missing: number;
        calibration: number;
      };
    };
  };
}

// Default parameters to include in reports.
// All gas units are ppb (storage unit) since the ppm→ppb migration.
const DEFAULT_PARAMETERS = [
  { key: "so2", label: "SO₂", unit: "ppb" },
  { key: "h2s", label: "H₂S", unit: "ppb" },
  { key: "no2", label: "NO₂", unit: "ppb" },
  { key: "benzene", label: "Benzene", unit: "ppb" },
  { key: "toluene", label: "Toluene", unit: "ppb" },
  { key: "ethylbenzene", label: "Ethylbenzene", unit: "ppb" },
  { key: "xylenes", label: "Xylene", unit: "ppb" },
  { key: "temperature", label: "Temperature", unit: "°C" },
  { key: "humidity", label: "Humidity", unit: "%" },
  { key: "pressure", label: "Pressure", unit: "hPa" },
  { key: "windSpeed", label: "Wind Speed", unit: "m/s" },
  { key: "windDirection", label: "Wind Direction", unit: "°" },
  { key: "solar", label: "Solar Radiation", unit: "W/m²" },
  { key: "rain", label: "Rain", unit: "mm" },
];

/**
 * Generate report data based on options
 */
export const generateReportData = async (
  options: ReportOptions,
): Promise<ReportData> => {
  const { deviceId, startDate, endDate, frequency, units } = options;

  // Get device info - try by ID first, then by device code
  let device;
  try {
    device = await getDeviceById(deviceId);
  } catch (error) {
    // If not found by ID, try by device code
    const deviceByCode = await prisma.device.findUnique({
      where: { deviceCode: deviceId },
    });

    if (!deviceByCode) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    device = deviceByCode;
  }

  // Determine interval based on frequency
  let interval = "1h"; // default hourly
  if (frequency === "daily") {
    interval = "1h";
  } else if (frequency === "weekly") {
    interval = "1d";
  } else if (frequency === "monthly") {
    interval = "1d";
  }

  // Get parameters to include
  const parameters = options.parameters || DEFAULT_PARAMETERS.map((p) => p.key);

  // Fetch telemetry data using the device's actual ID
  const telemetryData = await getTimeSeriesData({
    deviceId: device.id, // Use actual device ID from database
    startDate,
    endDate,
    interval,
    parameters: parameters.join(","),
  });

  // Debug: Log data retrieval
  console.log(
    `   📥 Retrieved ${(telemetryData as any[]).length} rows for ${frequency} report (interval: ${interval})`,
  );

  // Exclude maintenance buckets from the report entirely.
  // A bucket containing any maintenance minutes is marked in_maintenance
  // by the aggregation layer and must not appear in CSV/TXT exports.
  const maintenanceBucketCount = (telemetryData as any[]).filter(
    (row: any) => row.in_maintenance,
  ).length;
  const filteredTelemetry = (telemetryData as any[]).filter(
    (row: any) => !row.in_maintenance,
  );

  console.log(
    `   🔧 Excluded ${maintenanceBucketCount} maintenance bucket(s) from report`,
  );

  // Format data for report
  const formattedData = filteredTelemetry.map((row: any) => {
    const timestamp = new Date(row.bucket);
    const formatted: Record<string, any> = {
      date: timestamp.toLocaleDateString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur",
      }),
      isoDate: timestamp
        .toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" })
        .split("T")[0], // YYYY-MM-DD
      time: timestamp.toLocaleTimeString("en-MY", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kuala_Lumpur",
      }),
    };

    // Add parameter values, converted to the user's chosen unit.
    // Gases use 4 decimals (sub-ppb precision); other params use 2.
    const GAS_KEYS = new Set([
      "so2",
      "h2s",
      "no2",
      "benzene",
      "toluene",
      "ethylbenzene",
      "xylenes",
    ]);
    parameters.forEach((param) => {
      // PostgreSQL returns lowercase column names
      const avgKey = `${param.toLowerCase()}_avg`;
      const raw = row[avgKey];

      if (raw === null || raw === undefined) {
        formatted[param] = "N/A";
        return;
      }

      const targetUnit = units?.[param];
      const converted = convertValue(Number(raw), param, targetUnit);
      const decimals = GAS_KEYS.has(param) ? 4 : 2;
      formatted[param] =
        converted !== null && converted !== undefined
          ? Number(converted).toFixed(decimals)
          : "N/A";
    });

    return formatted;
  });

  // Calculate statistics — pass the filtered telemetry so maintenance
  // buckets do not influence averages, and pass the maintenance count so
  // availability can subtract them from the expected denominator.
  const summary = calculateSummary(
    filteredTelemetry,
    parameters,
    startDate,
    endDate,
    frequency,
    maintenanceBucketCount,
    units,
  );

  // Build the per-parameter Data Counts table at fixed 1-hour granularity
  // (regardless of report frequency: daily=24, weekly=168, monthly=24×N).
  // Reuse the main hourly fetch when the report is already hourly to avoid
  // a redundant DB query.
  const hourlyData =
    interval === "1h"
      ? (telemetryData as any[])
      : ((await getTimeSeriesData({
          deviceId: device.id,
          startDate,
          endDate,
          interval: "1h",
          parameters: parameters.join(","),
        })) as any[]);

  summary.dataCounts = calculateDataCounts(
    hourlyData,
    parameters,
    startDate,
    endDate,
    frequency,
  );

  // Debug: Log availability calculation
  console.log(
    `   📊 Availability calculated:`,
    JSON.stringify(summary.availability, null, 2),
  );
  console.log(
    `   ⚠️  Incomplete periods:`,
    JSON.stringify(summary.incompletePeriods, null, 2),
  );

  // Prepare parameter metadata, replacing storage units with the user's
  // chosen display units so column headers match the dashboard.
  const parameterMetadata = DEFAULT_PARAMETERS.filter((p) =>
    parameters.includes(p.key),
  ).map((p) => ({
    ...p,
    unit: resolveUnit(p.key, units),
  }));

  return {
    deviceId: device.deviceCode,
    deviceName: device.location || device.deviceCode,
    location: device.location || "Unknown",
    dateRange: `${startDate.toLocaleDateString("en-MY")} - ${endDate.toLocaleDateString("en-MY")}`,
    generatedOn: new Date().toLocaleString("en-MY"),
    frequency,
    parameters: parameterMetadata,
    data: formattedData,
    summary,
  };
};

/**
 * Calculate data availability percentage for each parameter
 */
const calculateAvailability = (
  data: any[],
  parameters: string[],
  startDate: Date,
  endDate: Date,
  frequency: string,
  maintenanceBuckets: number = 0,
): {
  availability: { [parameter: string]: number };
  incompletePeriods: {
    [parameter: string]: Array<{ date: string; percentage: number }>;
  };
} => {
  const availability: { [parameter: string]: number } = {};
  const incompletePeriods: {
    [parameter: string]: Array<{ date: string; percentage: number }>;
  } = {};

  // Calculate expected number of data points based on frequency
  let expectedPoints = 0;
  if (frequency === "daily") {
    // Daily reports: hourly intervals (24 hours)
    expectedPoints = 24;
  } else if (frequency === "weekly" || frequency === "monthly") {
    // Weekly/Monthly reports: daily intervals
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    expectedPoints = daysDiff;
  }

  // Subtract scheduled maintenance buckets from the denominator so they
  // do not penalize availability — DOE treats logged maintenance as excused.
  expectedPoints = Math.max(0, expectedPoints - maintenanceBuckets);

  // Calculate availability for each parameter
  const parameterMapping: { [key: string]: string } = {
    so2: "so2_avg",
    h2s: "h2s_avg",
    no2: "no2_avg",
    benzene: "benzene_avg",
    toluene: "toluene_avg",
    ethylbenzene: "ethylbenzene_avg",
    xylenes: "xylenes_avg",
    temperature: "temperature_avg",
    humidity: "humidity_avg",
    pressure: "pressure_avg",
    windSpeed: "windspeed_avg",
    windDirection: "winddirection_avg",
    solar: "solar_avg",
    rain: "rain_avg",
  };

  // Aggregation interval per frequency — daily = 1h buckets, others = 1d.
  const intervalSeconds = frequency === "daily" ? 3600 : 86400;

  console.log(
    `\n🔍 Calculating availability for ${parameters.length} parameters`,
  );
  console.log(`   Expected points: ${expectedPoints}`);
  console.log(`   Data rows: ${data.length}`);

  parameters.forEach((param) => {
    const columnName = parameterMapping[param];
    if (!columnName) {
      availability[param] = 0;
      incompletePeriods[param] = [];
      console.log(`   ❌ ${param}: No column mapping found`);
      return;
    }

    // Track incomplete periods for this parameter
    const incompleteList: Array<{ date: string; percentage: number }> = [];

    // Determine DOE Malaysia compliance threshold based on report frequency
    // Daily/Weekly: 75% threshold (≥45 min/hour or ≥18 hours/day)
    // Monthly: 95% threshold (≥22.8 hours/day for higher accuracy)
    const availabilityThreshold = frequency === "monthly" ? 95 : 75;

    // Per-parameter cadence-aware availability:
    // BTEX expects 4 readings/hour (15-min GC cycle); others expect 60.
    const countColumn = columnName.replace("_avg", "_count");
    const expectedForParam = expectedReadingsForInterval(param, intervalSeconds);

    const bucketAvailabilityPct = (row: any): number => {
      if (expectedForParam <= 0) return 0;
      const cnt = Number(row[countColumn] ?? 0);
      return (cnt / expectedForParam) * 100;
    };
    const meetsThreshold = (row: any): boolean =>
      bucketAvailabilityPct(row) >= availabilityThreshold;

    // Count rows where the parameter has data AND meets its DOE threshold.
    const validPoints = data.filter(
      (row) =>
        row[columnName] !== null &&
        row[columnName] !== undefined &&
        meetsThreshold(row),
    ).length;

    // Track incomplete periods (those NOT meeting DOE threshold)
    data.forEach((row) => {
      if (
        row[columnName] !== null &&
        row[columnName] !== undefined &&
        !meetsThreshold(row)
      ) {
        // Format date based on frequency
        const date = new Date(row.bucket);
        const dateStr =
          frequency === "daily"
            ? date.toLocaleTimeString("en-MY", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : date.toLocaleDateString("en-MY");

        // Per-parameter availability % (rounded to 1dp).
        const periodPercentage =
          Math.round(bucketAvailabilityPct(row) * 10) / 10;

        incompleteList.push({
          date: dateStr,
          percentage: periodPercentage,
        });
      }
    });

    // Calculate percentage
    const percentage =
      expectedPoints > 0 ? (validPoints / expectedPoints) * 100 : 0;
    availability[param] = Math.round(percentage * 10) / 10; // Round to 1 decimal place
    incompletePeriods[param] = incompleteList;

    console.log(
      `   📊 ${param} (${columnName}): ${validPoints}/${expectedPoints} complete quality = ${availability[param]}%`,
    );
  });

  return { availability, incompletePeriods };
};

/**
 * Calculate per-parameter data point counts at 1-hour granularity for the
 * "Data Counts" table in the PDF.
 *
 * Counts are always hour-based regardless of report frequency:
 *   daily   → 24
 *   weekly  → 168
 *   monthly → 24 × N days in the selected period
 *
 * Definitions (one row per parameter):
 *   total       — expected hourly buckets in the period
 *   calibration — hourly buckets overlapping logged maintenance (device-level,
 *                 same value for every parameter)
 *   available   — non-maintenance buckets where the parameter has a value
 *   validated   — buckets meeting DOE quality threshold (75% daily/weekly,
 *                 95% monthly), reusing the existing rule
 *   missing     — total − available − calibration
 */
const calculateDataCounts = (
  hourlyData: any[],
  parameters: string[],
  startDate: Date,
  endDate: Date,
  frequency: string,
): ReportData["summary"]["dataCounts"] => {
  const total = Math.max(
    0,
    Math.round((endDate.getTime() - startDate.getTime()) / (60 * 60 * 1000)),
  );

  const calibration = hourlyData.filter((row) => row.in_maintenance).length;

  // DOE Malaysia threshold per the existing rule used in calculateAvailability
  const availabilityThreshold = frequency === "monthly" ? 95 : 75;

  const parameterMapping: Record<string, string> = {
    so2: "so2_avg",
    h2s: "h2s_avg",
    no2: "no2_avg",
    benzene: "benzene_avg",
    toluene: "toluene_avg",
    ethylbenzene: "ethylbenzene_avg",
    xylenes: "xylenes_avg",
    temperature: "temperature_avg",
    humidity: "humidity_avg",
    pressure: "pressure_avg",
    windSpeed: "windspeed_avg",
    windDirection: "winddirection_avg",
    solar: "solar_avg",
    rain: "rain_avg",
  };

  const counts: ReportData["summary"]["dataCounts"] = {};

  for (const param of parameters) {
    const column = parameterMapping[param];
    if (!column) {
      counts[param] = {
        total,
        available: 0,
        validated: 0,
        missing: total,
        calibration,
      };
      continue;
    }

    // Per-parameter cadence: BTEX expects 4 readings/hour; others expect 60.
    // hourlyData rows are 1-hour buckets, so the interval is fixed at 3600s.
    const countColumn = column.replace("_avg", "_count");
    const expectedForParam = expectedReadingsForInterval(param, 3600);

    let available = 0;
    let validated = 0;

    for (const row of hourlyData) {
      if (row.in_maintenance) continue;
      const hasValue = row[column] !== null && row[column] !== undefined;
      if (!hasValue) continue;

      available++;

      const cnt = Number(row[countColumn] ?? 0);
      const pct = expectedForParam > 0 ? (cnt / expectedForParam) * 100 : 0;
      if (pct >= availabilityThreshold) validated++;
    }

    const missing = Math.max(0, total - available - calibration);
    counts[param] = { total, available, validated, missing, calibration };
  }

  return counts;
};

/**
 * Calculate summary statistics from telemetry data
 */
const calculateSummary = (
  data: any[],
  parameters: string[],
  startDate: Date,
  endDate: Date,
  frequency: string,
  maintenanceBuckets: number = 0,
  units?: Record<string, string>,
): ReportData["summary"] => {
  const conv = (val: number | null, param: string): number | null => {
    if (val === null) return null;
    const targetUnit = units?.[param];
    if (!targetUnit) return val;
    return convertValue(val, param, targetUnit);
  };
  // Get availability and incomplete periods
  const { availability, incompletePeriods } = calculateAvailability(
    data,
    parameters,
    startDate,
    endDate,
    frequency,
    maintenanceBuckets,
  ) || {
    availability: {},
    incompletePeriods: {},
  };

  const summary: ReportData["summary"] = {
    maxTemp: null,
    minWind: null,
    avgSO2: null,
    avgH2S: null,
    avgNO2: null,
    avgBenzene: null,
    avgToluene: null,
    avgEthylbenzene: null,
    avgXylenes: null,
    avgSolar: null,
    availability,
    incompletePeriods,
    maintenanceExcluded: maintenanceBuckets,
    dataCounts: {}, // populated separately from hourly-granularity data
  };

  if (data.length === 0) return summary;

  // Calculate temperature max
  if (parameters.includes("temperature")) {
    const temps = data
      .map((row) => row.temperature_avg)
      .filter((v) => v !== null)
      .map(Number);
    if (temps.length > 0) {
      summary.maxTemp = Math.max(...temps);
    }
  }

  // Calculate wind speed min
  if (parameters.includes("windSpeed")) {
    const winds = data
      .map((row) => row.windspeed_avg) // lowercase column name
      .filter((v) => v !== null)
      .map(Number);
    if (winds.length > 0) {
      summary.minWind = Math.min(...winds);
    }
  }

  // Calculate SO2 average
  if (parameters.includes("so2")) {
    const so2Values = data
      .map((row) => row.so2_avg)
      .filter((v) => v !== null)
      .map(Number);
    if (so2Values.length > 0) {
      summary.avgSO2 = so2Values.reduce((a, b) => a + b, 0) / so2Values.length;
    }
  }

  // Calculate NO2 average
  if (parameters.includes("no2")) {
    const no2Values = data
      .map((row) => row.no2_avg)
      .filter((v) => v !== null)
      .map(Number);
    if (no2Values.length > 0) {
      summary.avgNO2 = no2Values.reduce((a, b) => a + b, 0) / no2Values.length;
    }
  }

  // Calculate H2S average
  if (parameters.includes("h2s")) {
    const h2sValues = data
      .map((row) => row.h2s_avg)
      .filter((v) => v !== null)
      .map(Number);
    if (h2sValues.length > 0) {
      summary.avgH2S = h2sValues.reduce((a, b) => a + b, 0) / h2sValues.length;
    }
  }

  // Calculate BTEX component averages.
  // Each isomer is averaged independently from its dedicated column.
  const avgOf = (column: string): number | null => {
    const values = data
      .map((row) => row[column])
      .filter((v) => v !== null && v !== undefined)
      .map(Number);
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;
  };
  if (parameters.includes("benzene")) summary.avgBenzene = avgOf("benzene_avg");
  if (parameters.includes("toluene")) summary.avgToluene = avgOf("toluene_avg");
  if (parameters.includes("ethylbenzene"))
    summary.avgEthylbenzene = avgOf("ethylbenzene_avg");
  if (parameters.includes("xylenes")) summary.avgXylenes = avgOf("xylenes_avg");

  // Calculate Solar average
  if (parameters.includes("solar")) {
    const solarValues = data
      .map((row) => row.solar_avg)
      .filter((v) => v !== null)
      .map(Number);
    if (solarValues.length > 0) {
      summary.avgSolar =
        solarValues.reduce((a, b) => a + b, 0) / solarValues.length;
    }
  }

  // Convert numeric summary fields to the user's chosen units so the
  // PDF/CSV/TXT headers and stats line up with the dashboard display.
  summary.maxTemp = conv(summary.maxTemp, "temperature");
  summary.minWind = conv(summary.minWind, "windSpeed");
  summary.avgSO2 = conv(summary.avgSO2, "so2");
  summary.avgH2S = conv(summary.avgH2S, "h2s");
  summary.avgNO2 = conv(summary.avgNO2, "no2");
  summary.avgBenzene = conv(summary.avgBenzene, "benzene");
  summary.avgToluene = conv(summary.avgToluene, "toluene");
  summary.avgEthylbenzene = conv(summary.avgEthylbenzene, "ethylbenzene");
  summary.avgXylenes = conv(summary.avgXylenes, "xylenes");
  summary.avgSolar = conv(summary.avgSolar, "solar");

  return summary;
};

/**
 * Generate CSV content from report data
 */
/**
 * Generate CSV content from report data
 */
export const generateCSV = (reportData: ReportData): string => {
  const escapeCsv = (field: any): string => {
    if (field === null || field === undefined) return "";
    const stringField = String(field);
    if (
      stringField.includes(",") ||
      stringField.includes('"') ||
      stringField.includes("\n")
    ) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  // Force Excel to treat value as text string
  const excelText = (field: any): string => {
    if (field === null || field === undefined) return "";
    return `="${String(field)}"`;
  };

  const headers = [
    "Date",
    "Time",
    ...reportData.parameters.map((p) => `${p.label} (${p.unit})`),
  ].map(escapeCsv);

  const rows = reportData.data.map((row) => {
    return [
      excelText(row.isoDate || row.date), // Force text for date
      excelText(row.time), // Force text for time
      ...reportData.parameters.map((p) => row[p.key] || "N/A"),
    ].map((val, index) => (index < 2 ? val : escapeCsv(val)));
  });

  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = "\uFEFF";

  const csvLines = [
    `Report for ${escapeCsv(reportData.deviceName)}`,
    `Period: ${escapeCsv(reportData.dateRange)}`,
    `Generated: ${escapeCsv(reportData.generatedOn)}`,
    "",
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ];

  return BOM + csvLines.join("\r\n");
};

/**
 * Generate TXT content from report data
 */
export const generateTXT = (reportData: ReportData): string => {
  const divider = "=".repeat(80);
  const subDivider = "-".repeat(80);

  // Header
  const lines: string[] = [
    divider,
    `  AQMS Report - ${reportData.deviceName}`,
    divider,
    `  Location              : ${reportData.location}`,
    `  Period                : ${reportData.dateRange}`,
    `  Frequency             : ${reportData.frequency}`,
    `  Generated On          : ${reportData.generatedOn}`,
    `  Maintenance Excluded  : ${reportData.summary.maintenanceExcluded} bucket(s)`,
    divider,
    "",
  ];

  // Build column headers
  const paramHeaders = reportData.parameters.map(
    (p) => `${p.label} (${p.unit})`,
  );
  const colWidths = [
    12,
    8,
    ...paramHeaders.map((h) => Math.max(h.length + 2, 10)),
  ];
  const headerRow = [
    "Date".padEnd(colWidths[0]),
    "Time".padEnd(colWidths[1]),
    ...paramHeaders.map((h, i) => h.padEnd(colWidths[i + 2])),
  ].join(" | ");

  lines.push(headerRow);
  lines.push(subDivider);

  // Data rows
  for (const row of reportData.data) {
    const dateVal = (row.isoDate || row.date || "")
      .toString()
      .padEnd(colWidths[0]);
    const timeVal = (row.time || "").toString().padEnd(colWidths[1]);
    const paramVals = reportData.parameters.map((p, i) => {
      const val =
        row[p.key] !== undefined && row[p.key] !== null
          ? String(row[p.key])
          : "N/A";
      return val.padEnd(colWidths[i + 2]);
    });
    lines.push([dateVal, timeVal, ...paramVals].join(" | "));
  }

  lines.push("");
  lines.push(divider);
  lines.push("  End of Report");
  lines.push(divider);

  return lines.join("\n");
};
