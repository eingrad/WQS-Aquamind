/**
 * Map interval names to PostgreSQL interval strings
 */
export const INTERVAL_MAP: Record<string, string> = {
  raw: "5 seconds", // Raw data (5s)
  "1m": "1 minute", // 1 minute avg
  "30m": "30 minutes", // 30 minute avg
  "1h": "1 hour", // 1 hour avg
  "8h": "8 hours", // 8 hour avg
  "8h_ma": "8 hours", // 8 hour moving avg
  "24h": "24 hours", // 24 hour avg
  "24h_ma": "24 hours", // 24 hour moving avg
};

/**
 * Check if an interval represents a moving average
 */
export const isMovingAverage = (interval: string): boolean => {
  return interval.endsWith("_ma");
};

/**
 * Get the PostgreSQL interval string for a given interval
 */
export const getPostgresInterval = (interval: string): string => {
  const isMovingAvg = isMovingAverage(interval);
  const baseInterval = isMovingAvg ? interval.replace("_ma", "") : interval;
  return INTERVAL_MAP[interval] || INTERVAL_MAP[baseInterval] || "1 hour";
};
