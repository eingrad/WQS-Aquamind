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
        paramList: parameterList,
      })
    : buildRegularAggregationQuery({
        deviceId,
        startDate,
        endDate,
        interval,
        paramList: parameterList,
      });

  // Execute raw SQL query with parameterized binding
  const results = (await prisma.$queryRawUnsafe(
    query,
    ...params
  )) as any[]; // Type assertion for raw SQL results

  let output: any;

  // Regulatory averaging period — drives the additional range/relation
  // checks below. Only 1h and 24h have Malaysia AAQS standards.
  // 1h → Malaysia AAQS 1-hour table (SO2, NO2, environmentals)
  // 24h / 24h_ma → Malaysia AAQS 24-hour table (SO2, NO2, H2S, BTEX)
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
  const flagged = results.map((row: any) => {
    const maintenanceMinutes = Number(row.maintenance_minutes ?? 0);
    const inMaintenance = maintenanceMinutes > 0;

    // Maintenance bucket: keep underlying values for QA visibility on the
    // validation table; tag every parameter with the "maintenance" flag.
    if (inMaintenance) {
      const maintenanceFlags: Record<string, string> = {};
      parameterList.forEach((param) => {
        maintenanceFlags[param] = "maintenance";
      });
      return {
        ...row,
        validation_flags: maintenanceFlags,
        has_validation_issues: true,
        in_maintenance: true,
        maintenance_minutes: maintenanceMinutes,
      };
    }

    // Non-maintenance row. Layer regulatory range/relation checks on top
    // only when an AAQS averaging period applies (1h or 24h). Other
    // intervals come back without those checks but still carry the
    // in_maintenance: false flag so consumers can rely on it everywhere.
    if (!averagingPeriod) {
      return { ...row, in_maintenance: false };
    }

    const readings: Record<string, number> = {};
    parameterList.forEach((param) => {
      const avgValue = row[`${param}_avg`];
      if (avgValue !== null && avgValue !== undefined) {
        readings[param] = Number(avgValue);
      }
    });

    const validation = validateParameterValues(
      readings,
      "full",
      averagingPeriod,
    );

    return {
      ...row,
      validation_flags: validation.flags,
      has_validation_issues: validation.hasIssues,
      relation_violations: validation.relationViolations,
      in_maintenance: false,
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
