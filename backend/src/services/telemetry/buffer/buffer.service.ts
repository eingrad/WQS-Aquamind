import redis from "../../redis.service";
import {
  REQUIRED_POINTS_1M,
  EXPECTED_POINTS_1M,
} from "../aggregation/data-quality";

/**
 * Buffer service for managing 5-second sensor readings in Redis
 * Safe implementation - gracefully handles Redis unavailability
 */

interface SensorReading {
  timestamp: Date;
  value: number;
}

/**
 * Generate Redis key for buffering sensor data
 * Format: sensor:{deviceId}:{minute}:{parameter}
 */
const getBufferKey = (
  deviceId: string,
  minute: string,
  parameter: string,
): string => {
  return `sensor:${deviceId}:${minute}:${parameter}`;
};

/**
 * Get minute bucket for a timestamp (e.g., "2026-01-12T14:30")
 */
const getMinuteBucket = (timestamp: Date): string => {
  const year = timestamp.getUTCFullYear();
  const month = String(timestamp.getUTCMonth() + 1).padStart(2, "0");
  const day = String(timestamp.getUTCDate()).padStart(2, "0");
  const hour = String(timestamp.getUTCHours()).padStart(2, "0");
  const minute = String(timestamp.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

/**
 * Store a 5-second sensor reading in Redis buffer
 * Returns true if stored, false if Redis unavailable (graceful degradation)
 */
export const storeRawReading = async (
  deviceId: string,
  timestamp: Date,
  readings: Record<string, number>,
): Promise<boolean> => {
  // If Redis not available, log and return false (don't break)
  if (!redis.isRedisAvailable()) {
    console.warn("⚠️ Redis unavailable - skipping buffer storage");
    return false;
  }

  try {
    const minuteBucket = getMinuteBucket(timestamp);
    const TTL = 120; // 2 minutes (enough time for aggregation)

    // Store each parameter's reading
    for (const [parameter, value] of Object.entries(readings)) {
      if (value === null || value === undefined) continue;

      const key = getBufferKey(deviceId, minuteBucket, parameter);
      const reading: SensorReading = {
        timestamp,
        value,
      };

      // Push to Redis list
      await redis.listPush(key, JSON.stringify(reading));

      // Set TTL on first insert
      const client = redis.getRedis();
      if (client) {
        await client.expire(key, TTL);
      }
    }

    return true;
  } catch (error) {
    console.error("Failed to store reading in buffer:", error);
    return false;
  }
};

/**
 * Get all readings for a minute bucket
 * Returns empty object if Redis unavailable or no data
 */
export const getMinuteBuffer = async (
  deviceId: string,
  minuteBucket: string,
): Promise<Record<string, SensorReading[]>> => {
  if (!redis.isRedisAvailable()) {
    return {};
  }

  try {
    const buffer: Record<string, SensorReading[]> = {};

    const parameters = [
      "ph",
      "do",
      "nh3n",
      "cod",
      "bod",
      "tss",
      "temperature",
      "pressure",
      "depth",
    ];

    for (const parameter of parameters) {
      const key = getBufferKey(deviceId, minuteBucket, parameter);
      const rawData = await redis.listGetAll(key);

      if (rawData.length > 0) {
        buffer[parameter] = rawData.map((item) => JSON.parse(item));
      }
    }

    return buffer;
  } catch (error) {
    console.error("Failed to get minute buffer:", error);
    return {};
  }
};

/**
 * Clear buffer for a minute bucket (after aggregation)
 */
export const clearMinuteBuffer = async (
  deviceId: string,
  minuteBucket: string,
): Promise<boolean> => {
  if (!redis.isRedisAvailable()) {
    return false;
  }

  try {
    const parameters = [
      "ph",
      "do",
      "nh3n",
      "cod",
      "bod",
      "tss",
      "temperature",
      "pressure",
      "depth",
    ];

    for (const parameter of parameters) {
      const key = getBufferKey(deviceId, minuteBucket, parameter);
      await redis.del(key);
    }

    return true;
  } catch (error) {
    console.error("Failed to clear minute buffer:", error);
    return false;
  }
};

/**
 * Check data quality based on reading count
 * Returns "insufficient_data" if < 75% of expected readings
 */
export const assessBufferQuality = (
  readings: SensorReading[],
): "valid" | "insufficient_data" => {
  const count = readings.length;
  return count >= REQUIRED_POINTS_1M ? "valid" : "insufficient_data";
};

/**
 * Get reading counts per parameter
 */
export const getReadingCounts = (
  buffer: Record<string, SensorReading[]>,
): Record<string, number> => {
  const counts: Record<string, number> = {};

  for (const [parameter, readings] of Object.entries(buffer)) {
    counts[parameter] = readings.length;
  }

  return counts;
};

export default {
  storeRawReading,
  getMinuteBuffer,
  clearMinuteBuffer,
  assessBufferQuality,
  getReadingCounts,
};
