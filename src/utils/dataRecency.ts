/**
 * Data Recency Utilities
 * Check if sensor data is recent enough to be considered "live"
 */

/**
 * Check if the most recent data is within acceptable time range
 * AND has actual sensor readings (not all zeros/nulls)
 * @param data Array of data points with timestamp field 't'
 * @param maxAgeHours Maximum age in hours before data is considered stale
 * @returns true if most recent data is within maxAgeHours AND has real values
 */
export const hasRecentData = (
  data: Array<{ t: string; [key: string]: any }>,
  maxAgeHours: number = 3
): boolean => {
  if (!data || data.length === 0) {
    return false;
  }

  // Filter out empty buckets (all values are 0 or null)
  const dataWithValues = data.filter((item) => {
    // Check if any sensor value is non-zero and non-null
    const sensorKeys = [
      "ph",
      "do",
      "nh3n",
      "cod",
      "bod",
      "tss",
      "temperature",
      "depth",
    ];
    return sensorKeys.some((key) => {
      const value = item[key];
      return value !== null && value !== undefined && value !== 0;
    });
  });

  // If no data with actual values, return false
  if (dataWithValues.length === 0) {
    return false;
  }

  // Get the most recent timestamp from data with values
  const timestamps = dataWithValues
    .map((item) => new Date(item.t).getTime())
    .filter((ts) => !isNaN(ts));

  if (timestamps.length === 0) {
    return false;
  }

  const mostRecentTimestamp = Math.max(...timestamps);
  const now = Date.now();
  const ageInHours = (now - mostRecentTimestamp) / (1000 * 60 * 60);

  return ageInHours <= maxAgeHours;
};

/**
 * Get time since last data point in human-readable format
 * @param data Array of data points with timestamp field 't'
 * @returns String like "2 hours ago" or "30 minutes ago"
 */
export const getTimeSinceLastData = (
  data: Array<{ t: string }>
): string | null => {
  if (!data || data.length === 0) {
    return null;
  }

  const timestamps = data
    .map((item) => new Date(item.t).getTime())
    .filter((ts) => !isNaN(ts));

  if (timestamps.length === 0) {
    return null;
  }

  const mostRecentTimestamp = Math.max(...timestamps);
  const now = Date.now();
  const diffMs = now - mostRecentTimestamp;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
};
