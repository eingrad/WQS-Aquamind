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

  // Determine interval based on frequency.
  // Daily and monthly use 1-hour buckets so the report renders one row per
  // hour (daily = 24 rows, monthly = 24 × N days). Weekly stays on 1-day
  // buckets to keep the row count manageable for a 7-day window.
  let interval = "1h";
  if (frequency === "weekly") {
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

  // Per-parameter maintenance bucket counts. A bucket may have one
  // parameter under maintenance (human flag) while others are healthy —
  // each parameter's report-availability/exclusion is tracked separately.
  // The bucket-level `maintenanceBucketCount` is preserved for the
  // "Maintenance Excluded: N bucket(s)" metadata line.
  const maintenanceBucketCount = (telemetryData as any[]).filter(
    (row: any) => row.in_maintenance,
  ).length;

  const maintenanceByParam: Record<string, number> = {};
  parameters.forEach((p) => (maintenanceByParam[p] = 0));
  (telemetryData as any[]).forEach((row: any) => {
    const map = row.parameter_in_maintenance || {};
    parameters.forEach((p) => {
      if (map[p]) maintenanceByParam[p]++;
    });
  });

  console.log(
    `   🔧 ${maintenanceBucketCount} bucket(s) had at least one maintenance parameter; per-param counts:`,
    JSON.stringify(maintenanceByParam),
  );

  // Format data for report. Each row is rendered with the parameters
  // in maintenance hidden ("MAINT") so reviewers see at a glance which
  // values were excluded from analytics and why.
  const formattedData = (telemetryData as any[]).map((row: any) => {
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
      // Carried through so generateCSV can map "MAINT" cells to the
      // specific tag (CAL / UPT / REPL / INSP / RPR / MAINT) based on
      // the maintenance_log reason. PDF and TXT ignore this field.
      maintenance_reason: row.maintenance_reason ?? null,
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
    const paramMaint = row.parameter_in_maintenance || {};
    parameters.forEach((param) => {
      // Parameter-specific maintenance — render distinctly from N/A so
      // reviewers can tell missing data apart from excluded data.
      if (paramMaint[param]) {
        formatted[param] = "MAINT";
        return;
      }

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

  // Build a parallel telemetry array where maintenance-flagged values
  // are nulled per-parameter. Used for averages so each parameter's
  // statistics ignore only its own maintenance buckets, not unrelated
  // ones in the same hour.
  const telemetryWithoutMaintenance = (telemetryData as any[]).map(
    (row: any) => {
      const map = row.parameter_in_maintenance || {};
      const cleaned: any = { ...row };
      parameters.forEach((param) => {
        if (map[param]) {
          cleaned[`${param.toLowerCase()}_avg`] = null;
          cleaned[`${param.toLowerCase()}_min`] = null;
          cleaned[`${param.toLowerCase()}_max`] = null;
        }
      });
      return cleaned;
    },
  );

  // Calculate statistics — pass the per-parameter-cleaned telemetry so
  // each parameter's stats ignore only its own maintenance buckets.
  // maintenanceByParam drives the per-parameter expected-denominator
  // adjustment in calculateAvailability.
  const summary = calculateSummary(
    telemetryWithoutMaintenance,
    parameters,
    startDate,
    endDate,
    frequency,
    maintenanceBucketCount,
    units,
    maintenanceByParam,
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
  _maintenanceBuckets: number = 0,
  maintenanceByParam: Record<string, number> = {},
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

  // Expected number of buckets in the report period. Must match the
  // aggregation interval picked above: daily/monthly use 1h buckets,
  // weekly uses 1d buckets.
  let baseExpectedPoints = 0;
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (frequency === "daily") {
    baseExpectedPoints = 24;
  } else if (frequency === "monthly") {
    baseExpectedPoints = daysDiff * 24;
  } else if (frequency === "weekly") {
    baseExpectedPoints = daysDiff;
  }

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

  // Aggregation interval per frequency in seconds. Must match the bucket
  // size picked in generateReportData: daily/monthly = 1h (3600s),
  // weekly = 1d (86400s). Drives the per-parameter expected-reading
  // denominator used by `meetsThreshold`.
  const intervalSeconds = frequency === "weekly" ? 86400 : 3600;

  console.log(
    `\n🔍 Calculating availability for ${parameters.length} parameters`,
  );
  console.log(`   Base expected points: ${baseExpectedPoints}`);
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
        // Format the incomplete-period label based on bucket size:
        //   daily   → HH:MM (all entries are on the same day)
        //   monthly → date + HH:MM (1h buckets spread across many days)
        //   weekly  → date (1d buckets)
        const date = new Date(row.bucket);
        let dateStr: string;
        if (frequency === "daily") {
          dateStr = date.toLocaleTimeString("en-MY", {
            hour: "2-digit",
            minute: "2-digit",
          });
        } else if (frequency === "monthly") {
          dateStr = date.toLocaleString("en-MY", {
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
        } else {
          dateStr = date.toLocaleDateString("en-MY");
        }

        // Per-parameter availability % (rounded to 1dp).
        const periodPercentage =
          Math.round(bucketAvailabilityPct(row) * 10) / 10;

        incompleteList.push({
          date: dateStr,
          percentage: periodPercentage,
        });
      }
    });

    // Per-parameter expected denominator: subtract only the buckets that
    // were in maintenance for THIS parameter (DOE excuses logged
    // maintenance from the availability calculation).
    const expectedPoints = Math.max(
      0,
      baseExpectedPoints - (maintenanceByParam[param] ?? 0),
    );
    const percentage =
      expectedPoints > 0 ? (validPoints / expectedPoints) * 100 : 0;
    availability[param] = Math.round(percentage * 10) / 10; // Round to 1 decimal place
    incompletePeriods[param] = incompleteList;

    console.log(
      `   📊 ${param} (${columnName}): ${validPoints}/${expectedPoints} complete quality = ${availability[param]}% (maintenance excluded: ${maintenanceByParam[param] ?? 0})`,
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
        calibration: 0,
      };
      continue;
    }

    // Per-parameter cadence: BTEX expects 4 readings/hour; others expect 60.
    // hourlyData rows are 1-hour buckets, so the interval is fixed at 3600s.
    const countColumn = column.replace("_avg", "_count");
    const expectedForParam = expectedReadingsForInterval(param, 3600);

    let available = 0;
    let validated = 0;
    let calibration = 0;

    for (const row of hourlyData) {
      // Per-parameter maintenance flag — only this parameter's
      // calibration count is incremented, even if other params share
      // the bucket.
      const paramInMaintenance = !!row.parameter_in_maintenance?.[param];
      if (paramInMaintenance) {
        calibration++;
        continue;
      }

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
  maintenanceByParam: Record<string, number> = {},
): ReportData["summary"] => {
  const conv = (val: number | null, param: string): number | null => {
    if (val === null) return null;
    const targetUnit = units?.[param];
    if (!targetUnit) return val;
    return convertValue(val, param, targetUnit);
  };
  // Get availability and incomplete periods. Pass per-parameter maintenance
  // counts so each parameter's expected-denominator is adjusted only by
  // its own maintenance buckets, not by maintenance flagged for others.
  const { availability, incompletePeriods } = calculateAvailability(
    data,
    parameters,
    startDate,
    endDate,
    frequency,
    maintenanceBuckets,
    maintenanceByParam,
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

  // Maintenance reasons stored in maintenance_log.reason map to short
  // CSV tags so reviewers can tell at a glance why a value was suppressed.
  // Cells where the upstream pipeline wrote "MAINT" but no maintenance_log
  // row backs them (e.g. validation_status human flags) fall through to
  // the plain "MAINT" tag.
  const REASON_TO_TAG: Record<string, string> = {
    Calibration: "CAL",
    "Software Update": "UPT",
    "Sensor Replacement": "REPL",
    "Routine Inspection": "INSP",
    Repair: "RPR",
    Other: "MAINT",
  };
  const maintTag = (reason: string | null | undefined): string =>
    (reason && REASON_TO_TAG[reason]) || "MAINT";

  const headers = [
    "Date",
    "Time",
    ...reportData.parameters.map((p) => `${p.label} (${p.unit})`),
  ].map(escapeCsv);

  const rows = reportData.data.map((row) => {
    return [
      excelText(row.isoDate || row.date), // Force text for date
      excelText(row.time), // Force text for time
      ...reportData.parameters.map((p) => {
        const cell = row[p.key];
        if (cell === "MAINT") return maintTag(row.maintenance_reason);
        return cell || "N/A";
      }),
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
