import mqtt from "mqtt";
import { convertSensorTimestampToUTC } from "../utils/timezone";
import * as bufferService from "./telemetry/buffer/buffer.service";
import redis from "./redis.service";
import prisma from "../config/database";
import logger from "../config/logger";

/**
 * MQTT Subscriber Service
 *
 * Connects to the HiveMQ Cloud broker and subscribes to sensor data topics.
 * When a message arrives (every 1 minute per device), it:
 *   1. Translates channelId numbers to internal parameter names
 *   2. Resolves the device identifier to an internal UUID
 *   3. Stores the reading in the Redis buffer (via bufferService)
 *   4. Updates wind rose / pollution rose data in Redis for live charts
 *
 * The existing aggregation worker (aggregation.worker.ts) then picks up
 * the buffered readings every 60 seconds and writes 1-minute averages
 * to PostgreSQL.
 *
 * Data flow:
 *   HiveMQ Broker → this service → Redis buffer → aggregation worker → PostgreSQL
 */

// ─── Configuration ──────────────────────────────────────────────────────────

const BROKER_URL = process.env.MQTT_BROKER_URL || "mqtts://localhost:8883";
const MQTT_USERNAME = process.env.MQTT_USERNAME || "";
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "";

/**
 * Topic structure: congrego/{stationCode}
 * The "+" wildcard matches any station code (e.g., S40, S51)
 */
const SENSOR_DATA_TOPIC = process.env.MQTT_TOPIC || "congrego/+";

/**
 * Channel ID → internal parameter name mapping
 *
 * These IDs are assigned by the analyzer/data logger.
 * When new channels are added, update this map.
 */
const CHANNEL_MAP: Record<number, string> = {
  // Gas analyzers (congrego/S40, congrego/S51)
  13: "no", // Nitric Oxide (NO)
  14: "nox", // Nitrogen Oxides (NOx = NO + NO2)
  15: "no2", // Nitrogen Dioxide (NO2)
  22: "so2", // Sulfur Dioxide (SO2)
  23: "h2s", // Hydrogen Sulfide (H2S)
  // Meteorological sensors (congrego/MS)
  33: "temperature", // Temperature (°C)
  53: "windSpeed", // Wind Speed (m/s)
  54: "windDirection", // Wind Direction (°)
  55: "humidity", // Relative Humidity (%)
  56: "pressure", // Atmospheric Pressure (hPa)
  57: "rain", // Rainfall (mm)
  58: "solar", // Solar Radiation (W/m²)
  // BTEX channel will be added later:
  // ??: "btex",
};

/**
 * Wind rose configuration
 * 16 compass directions split into speed bins
 */
const COMPASS_DIRECTIONS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

const WIND_SPEED_BINS = ["0-2", "2-5", "5-10", "10-15", "15+"];
const POLLUTION_BINS = ["low", "moderate", "high", "very_high"];

// TTL for wind/pollution rose data in Redis (5 minutes)
const ROSE_TTL = 300;

// Accumulator for wind rose computation (keeps last 10 minutes of data per device)
const windAccumulator: Map<
  string,
  Array<{ speed: number; direction: number; timestamp: number }>
> = new Map();
const pollutionAccumulator: Map<
  string,
  Array<{ value: number; direction: number; timestamp: number }>
> = new Map();

// How long to keep readings in the accumulator (10 minutes in ms)
const ACCUMULATOR_WINDOW = 10 * 60 * 1000;

// ─── Device Identifier Cache ────────────────────────────────────────────────

/**
 * In-memory cache: MQTT identifier → device UUID
 * Avoids hitting the database on every message (messages arrive every 60s per device)
 */
const deviceIdCache: Map<string, string> = new Map();

/**
 * Resolve an MQTT identifier to the internal device UUID
 * Uses in-memory cache, falls back to database lookup
 *
 * @param mqttIdentifier - The identifier string from the MQTT payload
 * @returns Device UUID or null if not found
 */
const resolveDeviceId = async (
  mqttIdentifier: string,
): Promise<string | null> => {
  // Check cache first
  if (deviceIdCache.has(mqttIdentifier)) {
    return deviceIdCache.get(mqttIdentifier)!;
  }

  // Database lookup
  try {
    const device = await prisma.device.findUnique({
      where: { mqttIdentifier },
      select: { id: true },
    });

    if (device) {
      // Cache for future lookups
      deviceIdCache.set(mqttIdentifier, device.id);
      logger.info(`📡 MQTT: Resolved identifier to device ${device.id}`);
      return device.id;
    }

    logger.warn(`⚠️ MQTT: No device found for identifier: ${mqttIdentifier}`);
    return null;
  } catch (err) {
    logger.error(`❌ MQTT: Failed to resolve device identifier:`, err);
    return null;
  }
};

// ─── MQTT Client ────────────────────────────────────────────────────────────

let client: mqtt.MqttClient | null = null;

/**
 * Start the MQTT subscriber
 * Connects to the HiveMQ Cloud broker via TLS and begins listening for sensor data
 */
export const startMqttSubscriber = (): void => {
  try {
    logger.info(`📡 Connecting to MQTT broker at ${BROKER_URL}...`);

    client = mqtt.connect(BROKER_URL, {
      username: MQTT_USERNAME || undefined,
      password: MQTT_PASSWORD || undefined,
      reconnectPeriod: 5000, // Retry every 5 seconds if disconnected
      connectTimeout: 10000, // 10 second connection timeout
      clean: true, // Don't persist session on broker
      clientId: `petronas-backend-${process.pid}`, // Unique client ID
      // TLS options for HiveMQ Cloud (mqtts://)
      rejectUnauthorized: true, // Verify server certificate
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
    logger.warn(
      "📝 System will continue without MQTT — no live data ingestion",
    );
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

// ─── Payload Translation ──────────────────────────────────────────────────

/**
 * Expected MQTT payload format from the analyzer/data logger:
 *
 * {
 *   "identifier": "qtz3IiXLlxg2XXH_5G_tUMRIgOdZQltYwwcuxJXw-Zo",
 *   "report": "1min S40",
 *   "reportId": 1,
 *   "timestamp": "2026-04-26T13:20:00.0000000Z",
 *   "values": [
 *     { "channelId": 13, "unit": null, "function": "Average", "parameter": 0.0, "value": 7.4e-05 },
 *     { "channelId": 14, "unit": null, "function": "Average", "parameter": 0.0, "value": 0.00135 },
 *     { "channelId": 15, "unit": null, "function": "Average", "parameter": 0.0, "value": 0.00128 },
 *     { "channelId": 22, "unit": null, "function": "Average", "parameter": 0.0, "value": 0.00045 },
 *     { "channelId": 23, "unit": null, "function": "Average", "parameter": 0.0, "value": 0.00012 }
 *   ]
 * }
 */

interface MqttValueEntry {
  channelId: number;
  unit: string | null;
  function: string;
  parameter: number;
  value: number;
}

interface MqttPayload {
  identifier: string;
  report: string;
  reportId: number;
  timestamp: string;
  values: MqttValueEntry[];
}

/**
 * Translate the MQTT payload into our internal format
 *
 * @param payload - Parsed MQTT JSON payload
 * @returns Translated readings object with parameter names as keys, or null if no known channels
 */
const translatePayload = (
  payload: MqttPayload,
): Record<string, number> | null => {
  const readings: Record<string, number> = {};
  let translatedCount = 0;

  for (const entry of payload.values) {
    const paramName = CHANNEL_MAP[entry.channelId];

    if (paramName) {
      readings[paramName] = entry.value;
      translatedCount++;
    } else {
      // Unknown channel — log at debug level (don't spam)
      logger.debug(`📥 MQTT: Unknown channelId ${entry.channelId}, skipping`);
    }
  }

  if (translatedCount === 0) {
    return null;
  }

  return readings;
};

// ─── Message Processing ───────────────────────────────────────────────────

/**
 * Handle an incoming sensor data message
 * Translates the channel-based payload and feeds it into the existing pipeline
 */
const handleSensorMessage = async (
  topic: string,
  payload: Buffer,
): Promise<void> => {
  // Parse JSON payload
  const message: MqttPayload = JSON.parse(payload.toString());

  // Validate required fields
  const { identifier, timestamp, values } = message;

  if (!identifier || !timestamp || !values) {
    logger.warn(
      `⚠️ MQTT: Invalid message on ${topic} — missing required fields`,
    );
    return;
  }

  if (!Array.isArray(values) || values.length === 0) {
    logger.warn(`⚠️ MQTT: Empty values array on ${topic}`);
    return;
  }

  // ── Step 1: Resolve device identifier to UUID ─────────────────────

  const deviceId = await resolveDeviceId(identifier);

  if (!deviceId) {
    // Device not registered — skip silently after first warning (already logged in resolveDeviceId)
    return;
  }

  // ── Step 2: Translate channelIds to parameter names ───────────────

  const readings = translatePayload(message);

  if (!readings) {
    logger.warn(`⚠️ MQTT: No known channels in message from ${topic}`);
    return;
  }

  // ── Step 3: Parse timestamp ───────────────────────────────────────
  // The analyzer sends ISO 8601 with high precision: "2026-04-26T13:20:00.0000000Z"
  // Convert to UTC Date object

  const utcTimestamp = convertSensorTimestampToUTC(timestamp);

  // ── Step 4: Store in Redis buffer (for 1-minute aggregation) ──────

  const stored = await bufferService.storeRawReading(
    deviceId,
    utcTimestamp,
    readings,
  );

  if (stored) {
    logger.debug(
      `📥 MQTT: Buffered reading from ${deviceId} at ${timestamp} (${Object.keys(readings).join(", ")})`,
    );
  } else {
    logger.warn(`⚠️ MQTT: Failed to buffer reading (Redis unavailable?)`);
  }

  // ── Step 5: Update wind rose data ─────────────────────────────────

  if (
    readings.windSpeed !== undefined &&
    readings.windDirection !== undefined
  ) {
    updateWindRose(deviceId, readings.windSpeed, readings.windDirection);
  }

  // ── Step 6: Update pollution rose data (SO₂ by default) ───────────

  if (readings.so2 !== undefined && readings.windDirection !== undefined) {
    updatePollutionRose(deviceId, "SO2", readings.so2, readings.windDirection);
  }

  // ── Step 7: Update realtime parameters in Redis ───────────────────
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
  direction: number,
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
  windDirection: number,
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
  readings: Record<string, number>,
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
  if (value < 0.02) return "low"; // < 20 ppb
  if (value < 0.05) return "moderate"; // 20-50 ppb
  if (value < 0.1) return "high"; // 50-100 ppb
  return "very_high"; // > 100 ppb
};

export default {
  startMqttSubscriber,
  stopMqttSubscriber,
};
