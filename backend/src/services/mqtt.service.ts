import mqtt from "mqtt";
import { convertSensorTimestampToUTC } from "../utils/timezone";
import redis from "./redis.service";
import prisma from "../config/database";
import logger from "../config/logger";
import { createReading } from "./telemetry/operations/crud";
import { applyCalibration } from "./calibration.service";
import * as alertEvaluation from "./alert-evaluation.service";
import * as notificationService from "./notification.service";
import { isDeviceInMaintenance } from "./maintenance.service";

/**
 * MQTT Subscriber Service
 *
 * Connects to the HiveMQ Cloud broker and subscribes to sensor data topics.
 * When a message arrives (every 1 minute per device), it:
 *   1. Translates channelId numbers to internal parameter names
 *   2. Resolves the device identifier to an internal UUID
 *   3. Saves the reading directly to PostgreSQL (sensor already sends 1-min averages)
 *   4. Evaluates alert thresholds
 *   5. Caches the latest reading in Redis for the realtime dashboard widget
 *
 * Data flow:
 *   HiveMQ Broker → this service → PostgreSQL + Redis realtime cache
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
 * These IDs are assigned by the water quality sensor/data logger.
 * Update the channel numbers below to match your hardware configuration.
 */
const CHANNEL_MAP: Record<number, string> = {
  // Water quality sensors
  1: "ph", // pH (dimensionless)
  2: "do", // Dissolved Oxygen (mg/L)
  3: "nh3n", // Ammonia-Nitrogen NH₃-N (mg/L)
  4: "cod", // Chemical Oxygen Demand (mg/L)
  5: "bod", // Biochemical Oxygen Demand (mg/L)
  6: "tss", // Total Suspended Solids (mg/L)
  7: "temperature", // Water Temperature (°C)
  8: "depth", // Water Depth (m)
};

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
      clientId: `aquamind-backend-${process.pid}`, // Unique client ID
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

  const rawReadings = translatePayload(message);

  if (!rawReadings) {
    logger.warn(`⚠️ MQTT: No known channels in message from ${topic}`);
    return;
  }

  // ── Step 2b: Apply per-device sensor calibration ──────────────────
  // operation + value (multiply/divide/add/subtract). Done HERE, before
  // storage/alerts/WQI/realtime cache, so every consumer sees the corrected
  // value. The raw readings are kept and stored alongside for audit only when
  // a calibration actually changed something.
  const { values: readings, applied: calibrationApplied } =
    await applyCalibration(deviceId, rawReadings);

  // ── Step 3: Parse timestamp ───────────────────────────────────────
  // The analyzer sends ISO 8601 with high precision: "2026-04-26T13:20:00.0000000Z"
  // Convert to UTC Date object

  const utcTimestamp = convertSensorTimestampToUTC(timestamp);

  // ── Step 4: Save directly to database ────────────────────────────
  // Sensor sends 1-minute averaged readings — no buffering needed.

  try {
    await createReading({
      deviceId,
      observedAt: utcTimestamp,
      readings,
      // Only persist the raw copy when calibration actually altered a value.
      rawReadings: calibrationApplied ? rawReadings : undefined,
    });
    logger.debug(
      `💾 MQTT: Saved reading from ${deviceId} at ${timestamp} (${Object.keys(readings).join(", ")})`,
    );
  } catch (err) {
    logger.error(`❌ MQTT: Failed to save reading to database:`, err);
    return;
  }

  // ── Step 5: Alert evaluation ──────────────────────────────────────

  try {
    const inMaintenance = await isDeviceInMaintenance(deviceId, {
      start: utcTimestamp,
      end: utcTimestamp,
    });

    if (!inMaintenance) {
      const alertResults = await alertEvaluation.batchEvaluateParameters(
        deviceId,
        utcTimestamp,
        readings,
      );

      if (alertResults.length > 0) {
        logger.info(
          `🚨 ${alertResults.length} alert(s) triggered for ${deviceId}`,
        );
        for (const result of alertResults) {
          if (result.alertHistory) {
            await notificationService.sendMultiChannelNotification(
              result.alertHistory,
            );
          }
        }
      }
    }
  } catch (alertErr) {
    logger.error(`⚠️ MQTT: Alert evaluation error:`, alertErr);
  }

  // ── Step 6: Update realtime parameters in Redis ──────────────────
  //    Stores the latest reading for the dashboard widget.

  await updateRealtimeParams(deviceId, timestamp, readings);
};

// ─── Realtime Parameters ──────────────────────────────────────────────────

/**
 * Store the latest sensor readings in Redis for the realtime widget.
 * Each parameter is stored as { value, at } for per-parameter freshness tracking.
 */
type RealtimeReading = { value: number; at: string };

const updateRealtimeParams = async (
  deviceId: string,
  timestamp: string,
  readings: Record<string, number>,
): Promise<void> => {
  const key = `live:realtime:${deviceId}`;
  const REALTIME_TTL = 90; // seconds — bridge latency between 1-minute sensor reports

  // Build per-parameter entries from this message
  const incoming: Record<string, RealtimeReading> = {};
  for (const [param, value] of Object.entries(readings)) {
    incoming[param] = { value, at: timestamp };
  }

  // Read existing cached payload (if any) and merge new readings on top
  let mergedReadings: Record<string, RealtimeReading> = incoming;
  try {
    const existing = await redis.get(key);
    if (existing) {
      const parsed = JSON.parse(existing);
      mergedReadings = { ...(parsed.readings ?? {}), ...incoming };
    }
  } catch (err) {
    logger.warn(
      `⚠️ MQTT: Failed to read existing realtime cache, overwriting:`,
      err,
    );
  }

  const data = {
    timestamp, // most recent message time (informational)
    deviceId,
    readings: mergedReadings,
  };

  await redis.setWithTTL(key, JSON.stringify(data), REALTIME_TTL);
};

export default {
  startMqttSubscriber,
  stopMqttSubscriber,
};
