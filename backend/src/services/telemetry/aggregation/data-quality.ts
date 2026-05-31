/**
 * Data quality assessment for time aggregations
 *
 * Data Collection Architecture:
 * - Sensor data: 1-minute averaged readings (sensor sends pre-averaged data)
 * - Storage: PostgreSQL (1 record per minute per device)
 */

import { isDeviceInMaintenance } from "../../maintenance.service";

// ==================== 1-MINUTE VALIDATION ====================
// Expected data points for 1-minute validation (sensor sends 1 reading/minute)
export const EXPECTED_POINTS_1M = 1;

// Required points for valid 1-minute data (1 reading is sufficient)
export const REQUIRED_POINTS_1M = 1;

// ==================== 1-HOUR VALIDATION ====================
// Expected data points for 1-hour validation (based on 1-minute stored data)
const EXPECTED_POINTS_1H = 60; // 60 minutes

// Required points for valid 1-hour data (75% threshold = 45 minutes)
const REQUIRED_POINTS_1H = Math.ceil(EXPECTED_POINTS_1H * 0.75); // 45 points

// ==================== 24-HOUR VALIDATION ====================
// Expected data points for 24h validation (based on 1-minute resolution)
const EXPECTED_POINTS_24H = 1440; // 24 hours * 60 minutes

// Required points for valid 24h data (75% threshold = 18 hours)
const REQUIRED_POINTS_24H = Math.ceil(EXPECTED_POINTS_24H * 0.75); // 1080 points

// ==================== 30-MINUTE VALIDATION ====================
// Expected data points for 30-minute validation (based on 1-minute stored data)
const EXPECTED_POINTS_30M = 30; // 30 minutes

// Required points for valid 30-minute data (75% threshold = 22.5 minutes)
const REQUIRED_POINTS_30M = Math.ceil(EXPECTED_POINTS_30M * 0.75); // 23 points

// ==================== 8-HOUR VALIDATION ====================
// Expected data points for 8-hour validation (based on 1-minute stored data)
const EXPECTED_POINTS_8H = 480; // 8 hours * 60 minutes

// Required points for valid 8-hour data (75% threshold = 6 hours)
const REQUIRED_POINTS_8H = Math.ceil(EXPECTED_POINTS_8H * 0.75); // 360 points

/**
 * Get expected and required point counts based on interval
 */
export const getDataQualityThresholds = (interval: string) => {
  switch (interval) {
    case "1m":
      return {
        expected: EXPECTED_POINTS_1M,
        required: REQUIRED_POINTS_1M,
      };
    case "30m":
      return {
        expected: EXPECTED_POINTS_30M,
        required: REQUIRED_POINTS_30M,
      };
    case "1h":
      return {
        expected: EXPECTED_POINTS_1H,
        required: REQUIRED_POINTS_1H,
      };
    case "8h":
    case "8h_ma":
      return {
        expected: EXPECTED_POINTS_8H,
        required: REQUIRED_POINTS_8H,
      };
    case "1d":
      // 1-day aggregation: expects 1440 minutes (24 hours * 60 minutes)
      // Required: 1080 minutes (75% = 18 hours)
      return {
        expected: 1440,
        required: 1080,
      };
    case "24h":
    case "24h_ma":
      return {
        expected: EXPECTED_POINTS_24H,
        required: REQUIRED_POINTS_24H,
      };
    default:
      // For other intervals, return null (no data quality check)
      return null;
  }
};

/**
 * Assess if data has sufficient coverage to be considered valid
 */
export const assessDataQuality = (
  count: number,
  interval: string,
): "valid" | "insufficient_data" => {
  const thresholds = getDataQualityThresholds(interval);

  if (!thresholds) {
    // No quality check for this interval
    return "valid";
  }

  return count >= thresholds.required ? "valid" : "insufficient_data";
};

/**
 * Assess data quality with maintenance awareness
 * Priority: maintenance > insufficient_data > valid
 */
export const assessDataQualityWithMaintenance = async (
  deviceId: string,
  timeRange: { start: Date; end: Date },
  count: number,
  interval: string,
): Promise<"valid" | "maintenance" | "insufficient_data"> => {
  // Priority 1: Check if device was in maintenance during this period
  const inMaintenance = await isDeviceInMaintenance(deviceId, timeRange);

  if (inMaintenance) {
    return "maintenance";
  }

  // Priority 2: Check data availability
  return assessDataQuality(count, interval);
};

/**
 * Calculate data availability percentage for an interval
 */
export const calculateDataAvailability = (
  count: number,
  interval: string,
): number => {
  const thresholds = getDataQualityThresholds(interval);

  if (!thresholds) {
    return 100; // No quality check = assume 100%
  }

  return Math.round((count / thresholds.expected) * 100 * 10) / 10; // Round to 1 decimal
};
