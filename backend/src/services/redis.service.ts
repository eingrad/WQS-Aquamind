import Redis from "ioredis";

/**
 * Redis service for buffering 5-second sensor data
 * Safe implementation - falls back gracefully if Redis unavailable
 */

let redis: Redis | null = null;
let redisAvailable = false;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
      // Retry for up to 3 times, then give up
      if (times > 3) {
        console.error("❌ Redis connection failed after 3 retries");
        return null; // Stop retrying
      }
      return Math.min(times * 50, 2000); // Exponential backoff
    },
    lazyConnect: true, // Don't connect immediately
  });

  // Test connection
  redis
    .connect()
    .then(() => {
      console.log("✅ Redis connected successfully");
      redisAvailable = true;
    })
    .catch((error) => {
      console.warn("⚠️ Redis not available:", error.message);
      console.warn("📝 System will continue without Redis buffering");
      redisAvailable = false;
    });

  // Handle errors gracefully
  redis.on("error", (error) => {
    console.error("Redis error:", error.message);
    redisAvailable = false;
  });

  redis.on("reconnecting", () => {
    console.log("🔄 Redis reconnecting...");
  });
} catch (error) {
  console.error("❌ Failed to initialize Redis:", error);
  redis = null;
  redisAvailable = false;
}

/**
 * Check if Redis is available
 */
export const isRedisAvailable = (): boolean => {
  return redisAvailable && redis !== null;
};

/**
 * Get Redis client (safe - returns null if unavailable)
 */
export const getRedis = (): Redis | null => {
  return isRedisAvailable() ? redis : null;
};

/**
 * Store value in Redis with TTL (safe - returns false if unavailable)
 */
export const setWithTTL = async (
  key: string,
  value: string,
  ttlSeconds: number = 3600
): Promise<boolean> => {
  try {
    if (!isRedisAvailable() || !redis) return false;
    await redis.setex(key, ttlSeconds, value);
    return true;
  } catch (error) {
    console.error(`Failed to set Redis key ${key}:`, error);
    return false;
  }
};

/**
 * Get value from Redis (safe - returns null if unavailable)
 */
export const get = async (key: string): Promise<string | null> => {
  try {
    if (!isRedisAvailable() || !redis) return null;
    return await redis.get(key);
  } catch (error) {
    console.error(`Failed to get Redis key ${key}:`, error);
    return null;
  }
};

/**
 * Delete key from Redis (safe)
 */
export const del = async (key: string): Promise<boolean> => {
  try {
    if (!isRedisAvailable() || !redis) return false;
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Failed to delete Redis key ${key}:`, error);
    return false;
  }
};

/**
 * Add value to Redis list (safe)
 */
export const listPush = async (
  key: string,
  value: string
): Promise<boolean> => {
  try {
    if (!isRedisAvailable() || !redis) return false;
    await redis.rpush(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to push to Redis list ${key}:`, error);
    return false;
  }
};

/**
 * Get all values from Redis list (safe)
 */
export const listGetAll = async (key: string): Promise<string[]> => {
  try {
    if (!isRedisAvailable() || !redis) return [];
    return await redis.lrange(key, 0, -1);
  } catch (error) {
    console.error(`Failed to get Redis list ${key}:`, error);
    return [];
  }
};

/**
 * Graceful shutdown
 */
export const closeRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
  }
};

export default {
  isRedisAvailable,
  getRedis,
  setWithTTL,
  get,
  del,
  listPush,
  listGetAll,
  closeRedis,
};
