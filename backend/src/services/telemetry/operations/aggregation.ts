/**
 * Telemetry Aggregation Operations
 */

import prisma from "../../../config/database";
import {
  buildRegularAggregationQuery,
  buildMovingAverageQuery,
} from "../aggregation/query-builder";
import { isMovingAverage } from "../aggregation/interval-mapping";
import { validateParameterValues } from "../validation/parameter-validator";
import { computeWQI, classifyWQI } from "../wqi";
import redis from "../../redis.service";

interface TimeSeriesOptions {
  deviceId: string;
  startDate: Date;
  endDate: Date;
  interval: string;
  parameters: string;
}

interface HourlyAvgOptions {
  deviceId: string;
  startDate: Date;
  endDate: Date;
  parameter: string;
}

/**
 * Convert BigInt values to numbers for JSON serialization
 * Also convert Date objects to ISO strings
 */
const convertBigIntToNumber = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "bigint") {
    return Number(obj);
  }

  // Convert Date objects to ISO strings
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }

  if (typeof obj === "object") {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key]);
    }
    return converted;
  }

  return obj;
};

/**
 * TTL (seconds) for time-series cache, based on aggregation interval.
 * Shorter intervals change more often and get shorter cache lifetimes.
 */
const CACHE_TTL: Record<string, number> = {
  "1m": 30,     // Live data — 30 seconds
  "30m": 300,   // 5 minutes
  "1h": 300,    // 5 minutes
  "8h": 900,    // 15 minutes
  "8h_ma": 900,
  "24h": 900,   // 15 minutes
  "24h_ma": 900,
};

/**
 * Build a deterministic cache key from query parameters
 */
const buildCacheKey = (options: TimeSeriesOptions): string => {
  const { deviceId, startDate, endDate, interval, parameters } = options;
  // Round start/end to minute to improve cache hit rate for near-identical queries
  const startMin = Math.floor(startDate.getTime() / 60000);
  const endMin = Math.floor(endDate.getTime() / 60000);
  const sortedParams = parameters.split(",").map(p => p.trim()).sort().join(",");
  return `cache:timeseries:${deviceId}:${interval}:${sortedParams}:${startMin}:${endMin}`;
};

/**
 * Get time-series aggregated data
 * For 1-hour intervals, validates aggregates against regulatory limits
 * Uses Redis as a read-through cache to reduce database load
 */
export const getTimeSeriesData = async (options: TimeSeriesOptions) => {
  const { deviceId, startDate, endDate, interval, parameters } = options;

  // --- Redis cache check ---
  const cacheKey = buildCacheKey(options);
  const ttl = CACHE_TTL[interval] || 60;

  if (redis.isRedisAvailable()) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      // Cache read failed — fall through to DB query
      console.warn("⚠️ Redis cache read failed, querying DB directly:", err);
    }
  }

  // --- Database query (cache miss or Redis unavailable) ---
  const parameterList = parameters.split(",").map((p) => p.trim());

  // WQI is a DERIVED value, not a DB column — it's computed per bucket from the
  // six input parameters (+ temperature for DO % saturation). So whenever "wqi"
  // is requested (even on its own, e.g. the chart), make sure the SQL also
  // aggregates those inputs; otherwise their *_avg columns are absent and the
  // WQI comes back null. "wqi" itself is dropped by the column builder (it has
  // no PARAMETER_DB_MAP entry), so we just append the dependencies here.
  const WQI_DEPENDENCIES = ["ph", "do", "bod", "cod", "nh3n", "tss", "temperature"];
  const queryParamList = parameterList.includes("wqi")
    ? Array.from(new Set([...parameterList, ...WQI_DEPENDENCIES]))
    : parameterList;

  // Moving-average intervals (e.g. "8h_ma", "24h_ma") need the windowed
  // query and the underlying base bucket size as the Postgres interval
  // (Postgres can't parse "8h_ma" as an interval literal).
  const movingAvg = isMovingAverage(interval);
  const baseInterval = movingAvg ? interval.replace("_ma", "") : interval;

  const { query, params } = movingAvg
    ? buildMovingAverageQuery({
        deviceId,
        startDate,
        endDate,
        interval: baseInterval,
        paramList: queryParamList,
      })
    : buildRegularAggregationQuery({
        deviceId,
        startDate,
        endDate,
        interval,
        paramList: queryParamList,
      });

  // Execute raw SQL query with parameterized binding
  const results = (await prisma.$queryRawUnsafe(
    query,
    ...params
  )) as any[]; // Type assertion for raw SQL results

  let output: any;

  // Regulatory averaging period — drives the additional range/relation
  // checks below. Only 1h and 24h have Malaysia NWQS Class II standards.
  // 1h → NWQS 1-hour limits (pH, DO, NH3-N, COD, BOD, TSS)
  // 24h / 24h_ma → NWQS 24-hour limits
  const averagingPeriod: "1h" | "24h" | null =
    interval === "1h"
      ? "1h"
      : interval === "24h" || interval === "24h_ma"
      ? "24h"
      : null;

  // Maintenance flagging runs for every interval (raw, 1m, 30m, 1h, 8h,
  // 1d, …) so reports/charts can consistently exclude or annotate these
  // buckets regardless of the bucket size. Reports still gate via the
  // in_maintenance flag, and alarms are independently gated upstream by
  // a maintenance_log lookup in the aggregation worker.
  //
  // Per-parameter maintenance: <param>_maintenance_count is emitted by
  // the SQL aggregation and includes both scheduled-maintenance overlap
  // (whole device) and human flags from the Data Validation page (just
  // that one parameter). Per-parameter detection lets reports / analytics
  // count availability accurately for unaffected parameters.
  const flagged = results.map((row: any) => {
    const maintenanceMinutes = Number(row.maintenance_minutes ?? 0);

    // Build the per-parameter maintenance map from the SQL counts.
    // Postgres lower-cases unquoted aliases, so camelCase params like
    // `windSpeed` come back as `windspeed_maintenance_count` — look up
    // the lowercased form to avoid silently reading `undefined`.
    const parameterInMaintenance: Record<string, boolean> = {};
    let anyParamInMaintenance = false;
    parameterList.forEach((param) => {
      const cnt = Number(
        row[`${param.toLowerCase()}_maintenance_count`] ?? 0,
      );
      const isM = cnt > 0;
      parameterInMaintenance[param] = isM;
      if (isM) anyParamInMaintenance = true;
    });
    const inMaintenance = anyParamInMaintenance || maintenanceMinutes > 0;

    // Layer regulatory range/relation checks for non-maintenance params
    // only when an AAQS averaging period applies (1h or 24h). Maintenance
    // params skip range/relation checks and get the "maintenance" flag.
    let regulatoryFlags: Record<string, string> = {};
    let hasRegulatoryIssues = false;
    let relationViolations: any = undefined;
    if (averagingPeriod) {
      const readings: Record<string, number> = {};
      parameterList.forEach((param) => {
        if (parameterInMaintenance[param]) return; // skip maintenance params
        // Same lower-case issue here for camelCase params.
        const avgValue = row[`${param.toLowerCase()}_avg`];
        if (avgValue !== null && avgValue !== undefined) {
          readings[param] = Number(avgValue);
        }
      });
      const validation = validateParameterValues(
        readings,
        "full",
        averagingPeriod,
      );
      regulatoryFlags = validation.flags;
      hasRegulatoryIssues = validation.hasIssues;
      relationViolations = validation.relationViolations;
    }

    // Build final per-parameter flag map: "maintenance" for affected
    // params, otherwise whichever flag the regulatory check produced
    // (or default "valid" for non-AAQS intervals).
    const validation_flags: Record<string, string> = {};
    parameterList.forEach((param) => {
      validation_flags[param] = parameterInMaintenance[param]
        ? "maintenance"
        : regulatoryFlags[param] ?? "valid";
    });

    // Derive the DOE WQI for this bucket from its averaged parameter values.
    // Requires all six WQI inputs (+ temperature for DO % saturation); if any
    // is absent for this bucket, wqi_avg is null and downstream renders blank.
    const num = (v: any): number | null =>
      v === null || v === undefined ? null : Number(v);
    const wqiAvg = computeWQI({
      ph: num(row.ph_avg),
      do: num(row.do_avg),
      bod: num(row.bod_avg),
      cod: num(row.cod_avg),
      nh3n: num(row.nh3n_avg),
      tss: num(row.tss_avg),
      temperature: num(row.temperature_avg),
    });
    const wqiClass = classifyWQI(wqiAvg);

    return {
      ...row,
      wqi_avg: wqiAvg,
      wqi_class: wqiClass?.class ?? null,
      wqi_status: wqiClass?.status ?? null,
      validation_flags,
      has_validation_issues: anyParamInMaintenance || hasRegulatoryIssues,
      relation_violations: relationViolations,
      in_maintenance: inMaintenance,
      parameter_in_maintenance: parameterInMaintenance,
      maintenance_minutes: maintenanceMinutes,
      // Reason string from maintenance_log (e.g. "Calibration",
      // "Software Update", "Repair", …). NULL when the bucket is only
      // flagged via validation_status (no maintenance_log overlap).
      // Consumed by report.service.ts to emit per-reason CSV tags.
      maintenance_reason: row.maintenance_reason ?? null,
    };
  });

  output = convertBigIntToNumber(flagged);

  // --- Store in Redis cache ---
  if (redis.isRedisAvailable()) {
    try {
      await redis.setWithTTL(cacheKey, JSON.stringify(output), ttl);
    } catch (err) {
      // Cache write failed — non-critical, just log
      console.warn("⚠️ Redis cache write failed:", err);
    }
  }

  return output;
};

/**
 * Get hourly averages for a parameter
 */
export const getHourlyAverages = async (options: HourlyAvgOptions) => {
  const { deviceId, startDate, endDate, parameter } = options;

  // Build hourly aggregation query
  const { query, params } = buildRegularAggregationQuery({
    deviceId,
    startDate,
    endDate,
    interval: "1h",
    paramList: [parameter],
  });

  const results = await prisma.$queryRawUnsafe(
    query,
    ...params
  );

  // Convert BigInt values to numbers and Dates to ISO strings for JSON serialization
  return convertBigIntToNumber(results);
};
