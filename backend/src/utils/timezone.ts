/**
 * Timezone Conversion Utilities
 *
 * Handles conversion of sensor timestamps to UTC.
 * Sensors in Malaysia (UTC+8) may send local time without timezone info.
 * This utility ensures all timestamps are stored as UTC in the database.
 */

/**
 * Convert a timestamp to UTC, handling timezone-naive inputs
 *
 * @param timestamp - ISO 8601 timestamp string
 * @param defaultOffsetHours - Timezone offset to assume if none provided (default: 8 for Malaysia)
 * @returns Date object in UTC
 *
 * @example
 * // Timestamp with timezone (already UTC)
 * convertToUTC('2026-01-05T09:44:00.000Z') // No conversion needed
 *
 * // Timestamp with offset
 * convertToUTC('2026-01-05T17:44:00+08:00') // Converted to UTC
 *
 * // Timezone-naive (local Malaysia time assumed)
 * convertToUTC('2026-01-05T17:44:00') // Converted: 17:44 - 8h = 09:44 UTC
 */
export const convertToUTC = (
  timestamp: string | Date,
  defaultOffsetHours: number = 8
): Date => {
  // If already a Date object, return as-is
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // Check if timestamp has timezone information
  const hasTimezone =
    timestamp.includes("Z") || // UTC indicator
    timestamp.includes("+") || // Positive offset
    (timestamp.includes("T") &&
      timestamp.lastIndexOf("-") > timestamp.indexOf("T")); // Negative offset after T

  // If it has timezone info, let Date constructor handle it
  if (hasTimezone) {
    return new Date(timestamp);
  }

  // Timezone-naive: assume it's local sensor time (UTC+offsetHours)
  // Subtract offset to get UTC
  const localDate = new Date(timestamp);
  const utcDate = new Date(
    localDate.getTime() - defaultOffsetHours * 60 * 60 * 1000
  );

  return utcDate;
};

/**
 * Get configured timezone offset from environment
 * Defaults to Malaysia timezone (UTC+8)
 */
export const getSensorTimezoneOffset = (): number => {
  const offset = process.env.SENSOR_TIMEZONE_OFFSET;
  return offset ? parseInt(offset, 10) : 8;
};

/**
 * Convert sensor timestamp to UTC using configured timezone
 */
export const convertSensorTimestampToUTC = (timestamp: string | Date): Date => {
  const offset = getSensorTimezoneOffset();
  return convertToUTC(timestamp, offset);
};
