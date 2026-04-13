import mqtt from "mqtt";
import { convertSensorTimestampToUTC } from "../utils/timezone";
import * as bufferService from "./telemetry/buffer/buffer.service";
import redis from "./redis.service";
import logger from "../config/logger";

/**
 * MQTT Subscriber Service
 *
 * Connects to the Mosquitto broker and subscribes to sensor data topics.
 * When a message arrives (every 5 seconds per device), it:
 *   1. Parses the JSON payload
 *   2. Stores the reading in the Redis buffer (via bufferService)
 *   3. Updates wind rose / pollution rose data in Redis for live charts
 *
 * The existing aggregation worker (aggregation.worker.ts) then picks up
 * the buffered readings every 60 seconds and writes 1-minute averages
 * to PostgreSQL.
 *
 * Data flow:
 *   MQTT Broker → this service → Redis buffer → aggregation worker → PostgreSQL
 */

// ─── Configuration ──────────────────────────────────────────────────────────

const BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME || "";
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "";

/**
 * Topic structure: sensors/{deviceCode}/data
 * The "+" wildcard matches any device code
 */
const SENSOR_DATA_TOPIC = "sensors/+/data";

/**
 * Wind rose configuration
 * 16 compass directions split into speed bins
 */
const COMPASS_DIRECTIONS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

const WIND_SPEED_BINS = ["0-2", "2-5", "5-10", "10-15", "15+"];
const POLLUTION_BINS = ["low", "moderate", "high", "very_high"];

// TTL for wind/pollution rose data in Redis (5 minutes)
const ROSE_TTL = 300;

// Accumulator for wind rose computation (keeps last 10 minutes of data per device)
const windAccumulator: Map<string, Array<{ speed: number; direction: number; timestamp: number }>> = new Map();
const pollutionAccumulator: Map<string, Array<{ value: number; direction: number; timestamp: number }>> = new Map();

// How long to keep readings in the accumulator (10 minutes in ms)
const ACCUMULATOR_WINDOW = 10 * 60 * 1000;

// ─── MQTT Client ────────────────────────────────────────────────────────────

let client: mqtt.MqttClient | null = null;

/**
 * Start the MQTT subscriber
 * Connects to the broker and begins listening for sensor data
 */
export const startMqttSubscriber = (): void => {
  try {
    logger.info(`📡 Connecting to MQTT broker at ${BROKER_URL}...`);

    client = mqtt.connect(BROKER_URL, {
      username: MQTT_USERNAME || undefined,
      password: MQTT_PASSWORD || undefined,
      reconnectPeriod: 5000,       // Retry every 5 seconds if disconnected
      connectTimeout: 10000,       // 10 second connection timeout
      clean: true,                 // Don't persist session on broker
      clientId: `petronas-backend-${process.pid}`, // Unique client ID
    });

    // ── Connection Events ───────────────────────────────────────────────

    client.on("connect", () => {
      logger.info("✅ MQTT connected to broker");

      // Subscribe to sensor data topic
      client!.subscribe(SENSOR_DATA_TOPIC, { qos: 1 }, (err) => {
        if (err) {
          logger.error("❌ Failed to subscribe to MQTT topic:", err);
        } else {
          logger.info(`📥 MQTT subscribed to: ${SENSOR_DATA_TOPIC}`);
        }
      });
    });

    client.on("reconnect", () => {
      logger.info("🔄 MQTT reconnecting to broker...");
    });

    client.on("error", (err) => {
      logger.error("❌ MQTT error:", err.message);
    });

    client.on("close", () => {
      logger.warn("⚠️ MQTT connection closed");
    });

    client.on("offline", () => {
      logger.warn("⚠️ MQTT client offline");
    });

    // ── Message Handler ─────────────────────────────────────────────────

    client.on("message", async (topic: string, payload: Buffer) => {
      try {
        await handleSensorMessage(topic, payload);
      } catch (err) {
        logger.error("❌ Error processing MQTT message:", err);
      }
    });
  } catch (err) {
    logger.error("❌ Failed to start MQTT subscriber:", err);
    logger.warn("📝 System will continue without MQTT — no live data ingestion");
  }
};

/**
 * Stop the MQTT subscriber gracefully
 */
export const stopMqttSubscriber = (): void => {
  if (client) {
    client.end(true);
    client = null;
    logger.info("🛑 MQTT subscriber stopped");
  }
};

// ─── Message Processing ───────────────────────────────────────────────────

/**
 * Handle an incoming sensor data message
 *
 * Expected payload format:
 * {
 *   "deviceId": "uuid",
 *   "timestamp": "2026-04-10T10:45:00+08:00",
 *   "readings": {
 *     "so2": 0.045,
 *     "no2": 0.012,
 *     "windSpeed": 5.3,
 *     "windDirection": 225,
 *     ...
 *   }
 * }
 */
const handleSensorMessage = async (topic: string, payload: Buffer): Promise<void> => {
  // Parse JSON payload
  const message = JSON.parse(payload.toString());

  // Validate required fields
  const { deviceId, timestamp, readings } = message;

  if (!deviceId || !timestamp || !readings) {
    logger.warn(`⚠️ MQTT: Invalid message on ${topic} — missing required fields`);
    return;
  }

  if (typeof readings !== "object" || Object.keys(readings).length === 0) {
    logger.warn(`⚠️ MQTT: Empty readings on ${topic}`);
    return;
  }

  // Convert timestamp to UTC
  const utcTimestamp = convertSensorTimestampToUTC(timestamp);

  // ── Step 1: Store in Redis buffer (for 1-minute aggregation) ──────

  const stored = await bufferService.storeRawReading(deviceId, utcTimestamp, readings);

  if (stored) {
    logger.debug(`📥 MQTT: Buffered reading from ${deviceId} at ${timestamp}`);
  } else {
    logger.warn(`⚠️ MQTT: Failed to buffer reading (Redis unavailable?)`);
  }

  // ── Step 2: Update wind rose data ─────────────────────────────────

  if (readings.windSpeed !== undefined && readings.windDirection !== undefined) {
    updateWindRose(deviceId, readings.windSpeed, readings.windDirection);
  }

  // ── Step 3: Update pollution rose data (SO₂ by default) ───────────

  if (readings.so2 !== undefined && readings.windDirection !== undefined) {
    updatePollutionRose(deviceId, "SO2", readings.so2, readings.windDirection);
  }

  // ── Step 4: Update realtime parameters in Redis ───────────────────
  //    Stores the latest reading directly for the dashboard widget

  await updateRealtimeParams(deviceId, timestamp, readings);
};

// ─── Wind Rose Computation ────────────────────────────────────────────────

/**
 * Accumulate wind data and compute wind rose for live chart
 *
 * Wind rose = frequency of wind coming FROM each direction, split by speed bins
 * Uses a rolling 10-minute window of accumulated readings
 */
const updateWindRose = async (
  deviceId: string,
  speed: number,
  direction: number
): Promise<void> => {
  const now = Date.now();

  // Get or create accumulator for this device
  if (!windAccumulator.has(deviceId)) {
    windAccumulator.set(deviceId, []);
  }

  const readings = windAccumulator.get(deviceId)!;

  // Add new reading
  readings.push({ speed, direction, timestamp: now });

  // Remove readings older than 10 minutes
  const cutoff = now - ACCUMULATOR_WINDOW;
  while (readings.length > 0 && readings[0].timestamp < cutoff) {
    readings.shift();
  }

  // Compute wind rose from accumulated data
  const directions: Record<string, Record<string, number>> = {};

  for (const dir of COMPASS_DIRECTIONS) {
    directions[dir] = {};
    for (const bin of WIND_SPEED_BINS) {
      directions[dir][bin] = 0;
    }
  }

  for (const reading of readings) {
    const compassDir = degreesToCompass(reading.direction);
    const speedBin = getSpeedBin(reading.speed);
    directions[compassDir][speedBin]++;
  }

  // Store in Redis
  const data = {
    timestamp: new Date().toISOString(),
    deviceId,
    directions,
  };

  const key = `live:windrose:${deviceId}`;
  await redis.setWithTTL(key, JSON.stringify(data), ROSE_TTL);
};

// ─── Pollution Rose Computation ───────────────────────────────────────────

/**
 * Accumulate pollution data and compute pollution rose for live chart
 *
 * Pollution rose = concentration levels by wind direction
 * Shows where pollution is coming FROM
 */
const updatePollutionRose = async (
  deviceId: string,
  parameter: string,
  value: number,
  windDirection: number
): Promise<void> => {
  const now = Date.now();
  const accKey = `${deviceId}:${parameter}`;

  // Get or create accumulator
  if (!pollutionAccumulator.has(accKey)) {
    pollutionAccumulator.set(accKey, []);
  }

  const readings = pollutionAccumulator.get(accKey)!;

  // Add new reading
  readings.push({ value, direction: windDirection, timestamp: now });

  // Remove readings older than 10 minutes
  const cutoff = now - ACCUMULATOR_WINDOW;
  while (readings.length > 0 && readings[0].timestamp < cutoff) {
    readings.shift();
  }

  // Compute pollution rose from accumulated data
  const directions: Record<string, Record<string, number>> = {};

  for (const dir of COMPASS_DIRECTIONS) {
    directions[dir] = {};
    for (const bin of POLLUTION_BINS) {
      directions[dir][bin] = 0;
    }
  }

  for (const reading of readings) {
    const compassDir = degreesToCompass(reading.direction);
    const concBin = getConcentrationBin(reading.value);
    directions[compassDir][concBin]++;
  }

  // Store in Redis
  const data = {
    timestamp: new Date().toISOString(),
    deviceId,
    parameter: parameter.toUpperCase(),
    directions,
  };

  const key = `live:pollutionrose:${deviceId}:${parameter.toUpperCase()}`;
  await redis.setWithTTL(key, JSON.stringify(data), ROSE_TTL);
};

// ─── Realtime Parameters ──────────────────────────────────────────────────

/**
 * Store the latest sensor readings in Redis for the realtime widget
 * Simply overwrites the previous reading — dashboard always shows the latest
 */
const updateRealtimeParams = async (
  deviceId: string,
  timestamp: string,
  readings: Record<string, number>
): Promise<void> => {
  const data = {
    timestamp,
    deviceId,
    readings,
  };

  const key = `live:realtime:${deviceId}`;
  await redis.setWithTTL(key, JSON.stringify(data), 30); // 30s TTL
};

// ─── Helper Functions ─────────────────────────────────────────────────────

/**
 * Convert wind direction in degrees (0-360) to 16-point compass direction
 *
 *   0° = N, 90° = E, 180° = S, 270° = W
 *   Each direction covers 22.5°
 */
const degreesToCompass = (degrees: number): string => {
  // Normalize to 0-360
  const normalized = ((degrees % 360) + 360) % 360;

  // Each of 16 directions covers 22.5°
  // Add 11.25° offset so that 0° ± 11.25° = "N"
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_DIRECTIONS[index];
};

/**
 * Classify wind speed (m/s) into bins
 */
const getSpeedBin = (speed: number): string => {
  if (speed < 2) return "0-2";
  if (speed < 5) return "2-5";
  if (speed < 10) return "5-10";
  if (speed < 15) return "10-15";
  return "15+";
};

/**
 * Classify pollutant concentration (ppm) into bins
 * Thresholds based on typical SO₂ ambient levels
 */
const getConcentrationBin = (value: number): string => {
  if (value < 0.02) return "low";          // < 20 ppb
  if (value < 0.05) return "moderate";     // 20-50 ppb
  if (value < 0.1) return "high";          // 50-100 ppb
  return "very_high";                       // > 100 ppb
};

export default {
  startMqttSubscriber,
  stopMqttSubscriber,
};
