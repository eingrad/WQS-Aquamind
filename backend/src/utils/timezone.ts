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
  // Matches: Z, +HH:MM, -HH:MM, +HHMM, -HHMM, +HH, -HH at the end
  // Requires a time component (T or space) to avoid matching date-only strings like "2026-04-28"
  const hasTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/.test(timestamp) && /T| /.test(timestamp);

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

/**
 * Parse a date range for report generation.
 * Converts user-selected dates (in Malaysia time) to proper UTC boundaries.
 *
 * When a user selects "Feb 10", they mean Feb 10 00:00 Malaysia time (UTC+8).
 * This equals Feb 9 16:00 UTC.
 *
 * @param startDate - Start date string from the user
 * @param endDate - End date string from the user
 * @param offsetHours - Timezone offset (default: 8 for Malaysia)
 * @returns { start: Date, end: Date } in UTC
 *
 * @example
 * parseReportDateRange('2026-02-10', '2026-02-10')
 * // start = Feb 9 16:00 UTC, end = Feb 10 15:59:59.999 UTC
 */
export const parseReportDateRange = (
  startDate: string,
  endDate: string,
  offsetHours: number = 8
): { start: Date; end: Date } => {
  const OFFSET_MS = offsetHours * 60 * 60 * 1000;
  const hasTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/.test(startDate) && /T| /.test(startDate);

  let start: Date;
  let end: Date;

  if (hasTimezone) {
    // Input already has timezone — parse directly, just clamp to day boundaries
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    // Timezone-naive — treat as local Malaysia date
    start = new Date(startDate);
    end = new Date(endDate);

    // Set to beginning/end of day, then subtract offset to get UTC
    start.setUTCHours(0, 0, 0, 0);
    start.setTime(start.getTime() - OFFSET_MS);

    end.setUTCHours(23, 59, 59, 999);
    end.setTime(end.getTime() - OFFSET_MS);
  }

  return { start, end };
};
