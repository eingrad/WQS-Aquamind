/**
 * Sensor Calibration Service
 *
 * Per-device, per-parameter calibration using a single operation + value:
 *   multiply → raw * value
 *   divide   → raw / value
 *   add      → raw + value
 *   subtract → raw - value
 *   none     → raw (passthrough)
 *
 * Applied at MQTT ingestion (see mqtt.service) BEFORE the reading is stored,
 * alerted on, fed to WQI, and pushed to the realtime cache — so every consumer
 * sees the corrected value consistently. The raw readings are kept alongside
 * for audit. "none" is a no-op, so any parameter left uncalibrated passes
 * through unchanged.
 *
 * An in-memory cache avoids a DB hit on every message; it is refreshed whenever
 * a calibration is saved (single backend process, so this is reliable).
 */

import prisma from "../config/database";
import logger from "../config/logger";
import { createAuditLog, AuditAction } from "./audit.service";

/** Parameters that can be calibrated (match CHANNEL_MAP / DB columns). */
export const CALIBRATABLE_PARAMETERS = [
  "ph",
  "do",
  "nh3n",
  "cod",
  "bod",
  "tss",
  "temperature",
  "depth",
] as const;

export const CALIBRATION_OPERATIONS = [
  "none",
  "multiply",
  "divide",
  "add",
  "subtract",
] as const;
export type CalibrationOperation = (typeof CALIBRATION_OPERATIONS)[number];

export type CalibrationCoeff = { operation: CalibrationOperation; value: number };
export type CalibrationMap = Record<string, CalibrationCoeff>;

/** Apply a single operation to a raw value. */
const applyOp = (raw: number, operation: CalibrationOperation, value: number): number => {
  switch (operation) {
    case "multiply":
      return raw * value;
    case "divide":
      return value !== 0 ? raw / value : raw;
    case "add":
      return raw + value;
    case "subtract":
      return raw - value;
    default:
      return raw;
  }
};

// ─── In-memory cache: deviceId → { param → {operation, value} } ─────────────
const calibrationCache: Map<string, CalibrationMap> = new Map();

/**
 * Load (and cache) the active calibration map for a device — only parameters
 * with a real operation (not "none") are included.
 */
const loadCalibrationMap = async (deviceId: string): Promise<CalibrationMap> => {
  const cached = calibrationCache.get(deviceId);
  if (cached) return cached;

  const rows = await prisma.sensorCalibration.findMany({ where: { deviceId } });
  const map: CalibrationMap = {};
  for (const r of rows) {
    if (r.operation && r.operation !== "none") {
      map[r.parameter] = {
        operation: r.operation as CalibrationOperation,
        value: Number(r.value),
      };
    }
  }
  calibrationCache.set(deviceId, map);
  return map;
};

/** Drop a device's cache entry so the next read reloads from the DB. */
export const invalidateCalibrationCache = (deviceId: string): void => {
  calibrationCache.delete(deviceId);
};

/**
 * Apply calibration to a readings object (param → value). Returns the corrected
 * readings and whether anything was actually changed (so the caller can decide
 * whether to persist the raw copy).
 */
export const applyCalibration = async (
  deviceId: string,
  readings: Record<string, number>,
): Promise<{ values: Record<string, number>; applied: boolean }> => {
  const map = await loadCalibrationMap(deviceId);
  if (Object.keys(map).length === 0) {
    return { values: { ...readings }, applied: false };
  }

  const out: Record<string, number> = {};
  let applied = false;
  for (const [param, value] of Object.entries(readings)) {
    const c = map[param];
    if (c) {
      out[param] = applyOp(value, c.operation, c.value);
      applied = true;
    } else {
      out[param] = value;
    }
  }
  return { values: out, applied };
};

// ─── CRUD (for the calibration page / API) ──────────────────────────────────

/**
 * Return calibration for every calibratable parameter of a device, filling in
 * the "none" default for parameters that have never been calibrated.
 */
export const getDeviceCalibration = async (deviceId: string) => {
  const rows = await prisma.sensorCalibration.findMany({ where: { deviceId } });
  const byParam = new Map(rows.map((r) => [r.parameter, r]));

  return CALIBRATABLE_PARAMETERS.map((parameter) => {
    const row = byParam.get(parameter);
    const operation = (row?.operation as CalibrationOperation) ?? "none";
    return {
      parameter,
      operation,
      value: row ? Number(row.value) : 0,
      updatedAt: row?.updatedAt ?? null,
      isCalibrated: operation !== "none",
    };
  });
};

/**
 * Upsert a single parameter's calibration, audit-log it, and refresh the cache.
 * Throws on invalid input (bad param/operation, non-finite value, zero divisor
 * or multiplier).
 */
export const upsertCalibration = async (params: {
  deviceId: string;
  parameter: string;
  operation: string;
  value: number;
  userId?: string;
}) => {
  const { deviceId, parameter, operation, value, userId } = params;

  if (!CALIBRATABLE_PARAMETERS.includes(parameter as any)) {
    throw new Error(`Unknown parameter: ${parameter}`);
  }
  if (!CALIBRATION_OPERATIONS.includes(operation as any)) {
    throw new Error(`Unknown operation: ${operation}`);
  }

  // Normalise: "none" stores value 0 and ignores the input.
  const op = operation as CalibrationOperation;
  const val = op === "none" ? 0 : value;

  if (op !== "none") {
    if (!Number.isFinite(val)) {
      throw new Error("Value must be a finite number");
    }
    if ((op === "divide" || op === "multiply") && val === 0) {
      throw new Error(`Value must be non-zero for ${op}`);
    }
  }

  const existing = await prisma.sensorCalibration.findUnique({
    where: { uq_calibration_device_param: { deviceId, parameter } },
  });

  const saved = await prisma.sensorCalibration.upsert({
    where: { uq_calibration_device_param: { deviceId, parameter } },
    update: { operation: op, value: val, updatedBy: userId ?? null },
    create: { deviceId, parameter, operation: op, value: val, updatedBy: userId ?? null },
  });

  invalidateCalibrationCache(deviceId);

  try {
    await createAuditLog({
      action: AuditAction.CALIBRATION_UPDATED,
      performedBy: userId ?? "system",
      actionCategory: "CALIBRATION",
      entityType: "DEVICE",
      entityId: deviceId,
      changes: [
        {
          field: `${parameter}.operation`,
          oldValue: existing?.operation ?? "none",
          newValue: op,
        },
        {
          field: `${parameter}.value`,
          oldValue: existing ? Number(existing.value) : 0,
          newValue: val,
        },
      ],
      metadata: { deviceId, parameter },
    });
  } catch (err) {
    // Audit failure must not block the calibration save.
    logger.warn("⚠️ Calibration: failed to write audit log:", err);
  }

  return {
    parameter: saved.parameter,
    operation: saved.operation as CalibrationOperation,
    value: Number(saved.value),
    updatedAt: saved.updatedAt,
  };
};

export default {
  applyCalibration,
  invalidateCalibrationCache,
  getDeviceCalibration,
  upsertCalibration,
  CALIBRATABLE_PARAMETERS,
  CALIBRATION_OPERATIONS,
};
