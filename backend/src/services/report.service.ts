import prisma from "../config/database";
import { getTimeSeriesData } from "./telemetry.service";
import { getDeviceById } from "./device.service";
import { convertToDisplayUnit, BASE_UNITS } from "../utils/unit-conversion";
import { expectedReadingsForInterval } from "./telemetry/aggregation/parameter-cadence";

/** Row granularities a caller can pick for the report's Sensor Data table. */
export const REPORT_INTERVALS = ["1m", "1h"] as const;
export type ReportInterval = (typeof REPORT_INTERVALS)[number];

const INTERVAL_LABELS: Record<string, string> = {
  "1m": "1 Minute",
  "1h": "1 Hour",
  "1d": "1 Day",
};

const INTERVAL_SECONDS: Record<string, number> = {
  "1m": 60,
  "1h": 3600,
  "1d": 86400,
};

export interface ReportOptions {
  deviceId: string;
  startDate: Date;
  endDate: Date;
  frequency: "daily" | "weekly" | "monthly";
  /**
   * Bucket size for the Sensor Data rows. When omitted, falls back to the
   * frequency default (1h for daily/monthly, 1d for weekly).
   */
  interval?: ReportInterval;
  parameters?: string[];
  /**
   * Optional per-parameter unit preferences supplied by the caller (the
   * dashboard sends the user's selected units so the report matches what
   * they see on screen). Example: { temperature: "°F", depth: "ft" }
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
  /** Resolved bucket size ("1m" | "1h" | "1d") and its display label. */
  interval: string;
  intervalLabel: string;
  parameters: Array<{
    key: string;
    label: string;
    unit: string;
  }>;
  data: Array<Record<string, any>>;
  summary: {
    maxTemp: number | null;
    avgPh: number | null;
    avgDo: number | null;
    avgNh3n: number | null;
    avgCod: number | null;
    avgBod: number | null;
    avgTss: number | null;
    avgDepth: number | null;
    availability: {
      [parameter: string]: number;
    };
    incompletePeriods: {
      [parameter: string]: Array<{ date: string; percentage: number }>;
    };
    maintenanceExcluded: number;
    /**
     * Per-parameter data point counts at 1-hour granularity.
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

// Default parameters to include in reports (Malaysia NWQS Class II).
const DEFAULT_PARAMETERS = [
  { key: "ph",          label: "pH",          unit: "pH"   },
  { key: "do",          label: "DO",           unit: "mg/L" },
  { key: "nh3n",        label: "NH₃-N",        unit: "mg/L" },
  { key: "cod",         label: "COD",          unit: "mg/L" },
  { key: "bod",         label: "BOD",          unit: "mg/L" },
  { key: "tss",         label: "TSS",          unit: "mg/L" },
  { key: "temperature", label: "Temperature",  unit: "°C"   },
  { key: "depth",       label: "Depth",        unit: "m"    },
];

/**
 * Insert placeholder rows for buckets that have no telemetry at all.
 *
 * SQL's `time_buckets` CTE derives bucket times from `telemetry_processed`
 * rows, so an hour/day where the sensor recorded nothing produces no bucket
 * and is silently dropped. Reports then look like the missing day "never
 * happened", which is misleading — reviewers can't distinguish "no data"
 * from "this period wasn't in the report range".
 *
 * This helper builds the full expected bucket grid from `startDate` to
 * `endDate` at the report's interval and merges in real rows by ISO key.
 * Missing buckets become bare `{ bucket }` objects; downstream code already
 * handles undefined avg/maintenance fields by rendering "N/A".
 *
 * Only used for reports — the Analytics page still uses the raw SQL output
 * directly, so its chart line continues to break across genuine gaps.
 */
const fillBucketGaps = (
  rows: any[],
  startDate: Date,
  endDate: Date,
  interval: "1m" | "1h" | "1d",
): any[] => {
  const byKey = new Map<string, any>();
  for (const row of rows) {
    if (row?.bucket) {
      byKey.set(new Date(row.bucket).toISOString(), row);
    }
  }

  const filled: any[] = [];

  if (interval !== "1d") {
    // SQL emits each minute/hour bucket as `time_bucket(interval, observed_at)`
    // — i.e. the UTC floor of the observation. Iterate every step from the
    // floor-of-startDate to endDate.
    const stepMs = INTERVAL_SECONDS[interval] * 1000;
    const startMs = Math.floor(startDate.getTime() / stepMs) * stepMs;
    const endMs = endDate.getTime();
    for (let t = startMs; t < endMs; t += stepMs) {
      const key = new Date(t).toISOString();
      filled.push(byKey.get(key) ?? { bucket: key });
    }
  } else {
    // 1d aggregations apply `AT TIME ZONE 'Asia/Kuala_Lumpur'`, so the
    // bucket comes back as "YYYY-MM-DDT00:00:00Z" where YYYY-MM-DD is the
    // MYT calendar date. Iterate MYT calendar days and construct matching
    // UTC-midnight ISO strings as keys.
    const OFFSET_MS = 8 * 60 * 60 * 1000;
    const startMyt = new Date(startDate.getTime() + OFFSET_MS);
    const endMyt = new Date(endDate.getTime() + OFFSET_MS);
    const startUtcMid = Date.UTC(
      startMyt.getUTCFullYear(),
      startMyt.getUTCMonth(),
      startMyt.getUTCDate(),
    );
    const endUtcMid = Date.UTC(
      endMyt.getUTCFullYear(),
      endMyt.getUTCMonth(),
      endMyt.getUTCDate(),
    );
    const stepMs = 24 * 60 * 60 * 1000;
    for (let t = startUtcMid; t <= endUtcMid; t += stepMs) {
      const key = new Date(t).toISOString();
      filled.push(byKey.get(key) ?? { bucket: key });
    }
  }

  // Match the SQL `ORDER BY bucket DESC` so downstream slicing/formatting
  // sees the same order it always has.
  filled.sort(
    (a, b) => new Date(b.bucket).getTime() - new Date(a.bucket).getTime(),
  );
  return filled;
};

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
    const deviceByCode = await prisma.device.findUnique({
      where: { deviceCode: deviceId },
    });

    if (!deviceByCode) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    device = deviceByCode;
  }

  // Use the caller's chosen interval (1m / 1h). Without one, fall back to
  // the frequency default: daily and monthly use 1-hour buckets (daily = 24
  // rows, monthly = 24 × N days); weekly uses 1-day buckets.
  const interval: "1m" | "1h" | "1d" =
    options.interval ?? (frequency === "weekly" ? "1d" : "1h");

  // Get parameters to include
  const parameters = options.parameters || DEFAULT_PARAMETERS.map((p) => p.key);

  // Fetch telemetry data using the device's actual ID, then fill in
  // placeholder rows for buckets the SQL omitted because they had zero
  // telemetry. Reports need to show "N/A" for missing periods rather than
  // skip them silently.
  const rawTelemetry = (await getTimeSeriesData({
    deviceId: device.id,
    startDate,
    endDate,
    interval,
    parameters: parameters.join(","),
  })) as any[];

  const telemetryData = fillBucketGaps(
    rawTelemetry,
    startDate,
    endDate,
    interval,
  );

  console.log(
    `   📥 Retrieved ${rawTelemetry.length} rows (with gaps filled: ${telemetryData.length}) for ${frequency} report (interval: ${interval})`,
  );

  // Per-parameter maintenance bucket counts.
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

  // Format data for report.
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
      // the maintenance_log reason.
      maintenance_reason: row.maintenance_reason ?? null,
    };

    const paramMaint = row.parameter_in_maintenance || {};
    parameters.forEach((param) => {
      if (paramMaint[param]) {
        formatted[param] = "MAINT";
        return;
      }

      const avgKey = `${param.toLowerCase()}_avg`;
      const raw = row[avgKey];

      if (raw === null || raw === undefined) {
        formatted[param] = "N/A";
        return;
      }

      const targetUnit = units?.[param];
      const converted = targetUnit
        ? convertToDisplayUnit(Number(raw), param, targetUnit)
        : Number(raw);
      formatted[param] = Number(converted).toFixed(2);
    });

    return formatted;
  });

  // Build a parallel telemetry array where maintenance-flagged values
  // are nulled per-parameter. Used for averages so each parameter's
  // statistics ignore only its own maintenance buckets.
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

  const summary = calculateSummary(
    telemetryWithoutMaintenance,
    parameters,
    startDate,
    endDate,
    frequency,
    interval,
    maintenanceBucketCount,
    units,
    maintenanceByParam,
  );

  // Build the per-parameter Data Counts table at fixed 1-hour granularity.
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

  console.log(
    `   📊 Availability calculated:`,
    JSON.stringify(summary.availability, null, 2),
  );

  // Prepare parameter metadata with display units.
  const parameterMetadata = DEFAULT_PARAMETERS.filter((p) =>
    parameters.includes(p.key),
  ).map((p) => ({
    ...p,
    unit: units?.[p.key] ?? p.unit,
  }));

  return {
    deviceId: device.deviceCode,
    deviceName: device.location || device.deviceCode,
    location: device.location || "Unknown",
    dateRange: `${startDate.toLocaleDateString("en-MY")} - ${endDate.toLocaleDateString("en-MY")}`,
    generatedOn: new Date().toLocaleString("en-MY"),
    frequency,
    interval,
    intervalLabel: INTERVAL_LABELS[interval],
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
  interval: string,
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

  // Aggregation interval in seconds.
  const intervalSeconds = INTERVAL_SECONDS[interval] ?? 3600;
  const bucketsPerHour = 3600 / intervalSeconds;

  // Expected number of buckets in the report period.
  let baseExpectedPoints = 0;
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (interval === "1d") {
    baseExpectedPoints = daysDiff;
  } else if (frequency === "daily") {
    baseExpectedPoints = 24 * bucketsPerHour;
  } else {
    baseExpectedPoints = daysDiff * 24 * bucketsPerHour;
  }

  const parameterMapping: { [key: string]: string } = {
    ph:          "ph_avg",
    do:          "do_avg",
    nh3n:        "nh3n_avg",
    cod:         "cod_avg",
    bod:         "bod_avg",
    tss:         "tss_avg",
    temperature: "temperature_avg",
    depth:       "depth_avg",
  };

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

    const incompleteList: Array<{ date: string; percentage: number }> = [];

    // DOE Malaysia compliance threshold: 75% daily/weekly, 95% monthly
    const availabilityThreshold = frequency === "monthly" ? 95 : 75;

    const countColumn = columnName.replace("_avg", "_count");
    const expectedForParam = expectedReadingsForInterval(param, intervalSeconds);

    const bucketAvailabilityPct = (row: any): number => {
      if (expectedForParam <= 0) return 0;
      const cnt = Number(row[countColumn] ?? 0);
      return (cnt / expectedForParam) * 100;
    };
    const meetsThreshold = (row: any): boolean =>
      bucketAvailabilityPct(row) >= availabilityThreshold;

    const validPoints = data.filter(
      (row) =>
        row[columnName] !== null &&
        row[columnName] !== undefined &&
        meetsThreshold(row),
    ).length;

    data.forEach((row) => {
      if (
        row[columnName] !== null &&
        row[columnName] !== undefined &&
        !meetsThreshold(row)
      ) {
        const date = new Date(row.bucket);
        let dateStr: string;
        if (frequency === "daily") {
          dateStr = date.toLocaleTimeString("en-MY", {
            hour: "2-digit",
            minute: "2-digit",
          });
        } else if (interval !== "1d") {
          dateStr = date.toLocaleString("en-MY", {
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
        } else {
          dateStr = date.toLocaleDateString("en-MY");
        }

        const periodPercentage =
          Math.round(bucketAvailabilityPct(row) * 10) / 10;

        incompleteList.push({ date: dateStr, percentage: periodPercentage });
      }
    });

    const expectedPoints = Math.max(
      0,
      baseExpectedPoints - (maintenanceByParam[param] ?? 0),
    );
    const percentage =
      expectedPoints > 0 ? (validPoints / expectedPoints) * 100 : 0;
    availability[param] = Math.round(percentage * 10) / 10;
    incompletePeriods[param] = incompleteList;

    console.log(
      `   📊 ${param} (${columnName}): ${validPoints}/${expectedPoints} complete = ${availability[param]}% (maintenance excluded: ${maintenanceByParam[param] ?? 0})`,
    );
  });

  return { availability, incompletePeriods };
};

/**
 * Calculate per-parameter data point counts at 1-hour granularity for the
 * "Data Counts" table in the PDF.
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

  const availabilityThreshold = frequency === "monthly" ? 95 : 75;

  const parameterMapping: Record<string, string> = {
    ph:          "ph_avg",
    do:          "do_avg",
    nh3n:        "nh3n_avg",
    cod:         "cod_avg",
    bod:         "bod_avg",
    tss:         "tss_avg",
    temperature: "temperature_avg",
    depth:       "depth_avg",
  };

  const counts: ReportData["summary"]["dataCounts"] = {};

  for (const param of parameters) {
    const column = parameterMapping[param];
    if (!column) {
      counts[param] = { total, available: 0, validated: 0, missing: total, calibration: 0 };
      continue;
    }

    // All water quality params report 60 readings/hour.
    const countColumn = column.replace("_avg", "_count");
    const expectedForParam = expectedReadingsForInterval(param, 3600);

    let available = 0;
    let validated = 0;
    let calibration = 0;

    for (const row of hourlyData) {
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
  interval: string,
  maintenanceBuckets: number = 0,
  units?: Record<string, string>,
  maintenanceByParam: Record<string, number> = {},
): ReportData["summary"] => {
  const conv = (val: number | null, param: string): number | null => {
    if (val === null) return null;
    const targetUnit = units?.[param];
    if (!targetUnit) return val;
    return convertToDisplayUnit(val, param, targetUnit);
  };

  const { availability, incompletePeriods } = calculateAvailability(
    data,
    parameters,
    startDate,
    endDate,
    frequency,
    interval,
    maintenanceBuckets,
    maintenanceByParam,
  ) || { availability: {}, incompletePeriods: {} };

  const summary: ReportData["summary"] = {
    maxTemp: null,
    avgPh: null,
    avgDo: null,
    avgNh3n: null,
    avgCod: null,
    avgBod: null,
    avgTss: null,
    avgDepth: null,
    availability,
    incompletePeriods,
    maintenanceExcluded: maintenanceBuckets,
    dataCounts: {},
  };

  if (data.length === 0) return summary;

  const avgOf = (column: string): number | null => {
    const values = data
      .map((row) => row[column])
      .filter((v) => v !== null && v !== undefined)
      .map(Number);
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;
  };

  if (parameters.includes("temperature")) {
    const temps = data
      .map((row) => row.temperature_avg)
      .filter((v) => v !== null)
      .map(Number);
    if (temps.length > 0) summary.maxTemp = Math.max(...temps);
  }

  if (parameters.includes("ph"))    summary.avgPh    = avgOf("ph_avg");
  if (parameters.includes("do"))    summary.avgDo    = avgOf("do_avg");
  if (parameters.includes("nh3n"))  summary.avgNh3n  = avgOf("nh3n_avg");
  if (parameters.includes("cod"))   summary.avgCod   = avgOf("cod_avg");
  if (parameters.includes("bod"))   summary.avgBod   = avgOf("bod_avg");
  if (parameters.includes("tss"))   summary.avgTss   = avgOf("tss_avg");
  if (parameters.includes("depth")) summary.avgDepth = avgOf("depth_avg");

  summary.maxTemp  = conv(summary.maxTemp, "temperature");
  summary.avgPh    = conv(summary.avgPh,   "ph");
  summary.avgDo    = conv(summary.avgDo,   "do");
  summary.avgNh3n  = conv(summary.avgNh3n, "nh3n");
  summary.avgCod   = conv(summary.avgCod,  "cod");
  summary.avgBod   = conv(summary.avgBod,  "bod");
  summary.avgTss   = conv(summary.avgTss,  "tss");
  summary.avgDepth = conv(summary.avgDepth, "depth");

  return summary;
};

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

  const excelText = (field: any): string => {
    if (field === null || field === undefined) return "";
    return `="${String(field)}"`;
  };

  // Maintenance reasons stored in maintenance_log.reason map to short CSV tags.
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
      excelText(row.isoDate || row.date),
      excelText(row.time),
      ...reportData.parameters.map((p) => {
        const cell = row[p.key];
        if (cell === "MAINT") return maintTag(row.maintenance_reason);
        return cell || "N/A";
      }),
    ].map((val, index) => (index < 2 ? val : escapeCsv(val)));
  });

  const BOM = "﻿";

  const csvLines = [
    `Report for ${escapeCsv(reportData.deviceName)}`,
    `Period: ${escapeCsv(reportData.dateRange)}`,
    `Interval: ${escapeCsv(reportData.intervalLabel)}`,
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

  const lines: string[] = [
    divider,
    `  WQMS Report - ${reportData.deviceName}`,
    divider,
    `  Location              : ${reportData.location}`,
    `  Period                : ${reportData.dateRange}`,
    `  Frequency             : ${reportData.frequency}`,
    `  Interval              : ${reportData.intervalLabel}`,
    `  Generated On          : ${reportData.generatedOn}`,
    `  Maintenance Excluded  : ${reportData.summary.maintenanceExcluded} bucket(s)`,
    divider,
    "",
  ];

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
