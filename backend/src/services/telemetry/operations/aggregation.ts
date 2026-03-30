/**
 * Telemetry Aggregation Operations
 */

import prisma from "../../../config/database";
import { buildRegularAggregationQuery } from "../aggregation/query-builder";
import { validateParameterValues } from "../validation/parameter-validator";

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
 * Get time-series aggregated data
 * For 1-hour intervals, validates aggregates against regulatory limits
 */
export const getTimeSeriesData = async (options: TimeSeriesOptions) => {
  const { deviceId, startDate, endDate, interval, parameters } = options;

  const parameterList = parameters.split(",").map((p) => p.trim());

  // Build the aggregation query
  const { query, params } = buildRegularAggregationQuery({
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

  // Validate 1-hour aggregates against regulatory limits
  if (interval === "1h") {
    const validatedResults = results.map((row: any) => {
      // Extract average values for validation
      const readings: Record<string, number> = {};
      parameterList.forEach((param) => {
        const avgValue = row[`${param}_avg`];
        if (avgValue !== null && avgValue !== undefined) {
          readings[param] = Number(avgValue);
        }
      });

      // Validate with full regulatory compliance checks
      const validation = validateParameterValues(readings, "full");

      return {
        ...row,
        validation_flags: validation.flags,
        has_validation_issues: validation.hasIssues,
        relation_violations: validation.relationViolations,
      };
    });

    return convertBigIntToNumber(validatedResults);
  }

  // For other intervals, return without validation
  return convertBigIntToNumber(results);
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
