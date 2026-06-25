/**
 * Telemetry CRUD Operations
 */

import { Prisma } from "@prisma/client";
import prisma from "../../../config/database";
import { validateParameterValues } from "../validation/parameter-validator";
import { isDeviceInMaintenance } from "../../maintenance.service";
import { REQUIRED_POINTS_1M } from "../aggregation/data-quality";

interface ReadingInput {
  deviceId: string;
  observedAt: Date;
  readings: Record<string, number>;
  dataCounts?: Record<string, number>; // Optional: reading count per parameter (for quality check)
  rawReadings?: Record<string, number>; // Optional: pre-calibration values (stored for audit)
}

/**
 * Create a single telemetry reading
 */
export const createReading = async (input: ReadingInput) => {
  const { deviceId, observedAt, readings, dataCounts, rawReadings } = input;

  // Check if device is in maintenance during this timestamp
  const inMaintenance = await isDeviceInMaintenance(deviceId, {
    start: observedAt,
    end: observedAt,
  });

  let validation;
  if (inMaintenance) {
    // Priority 1: Maintenance overrides everything
    const maintenanceFlags: Record<string, any> = {};
    Object.keys(readings).forEach((param) => {
      maintenanceFlags[param] = "maintenance";
    });
    validation = {
      flags: maintenanceFlags,
      hasIssues: true,
    };
  } else {
    // Priority 2: Check data point counts (insufficient_data)
    const insufficientFlags: Record<string, any> = {};
    let hasInsufficientData = false;

    if (dataCounts) {
      Object.entries(dataCounts).forEach(([param, count]) => {
        if (count < REQUIRED_POINTS_1M) {
          insufficientFlags[param] = "insufficient_data";
          hasInsufficientData = true;
        }
      });
    }

    if (hasInsufficientData) {
      // If any parameter has insufficient data, flag those parameters
      validation = {
        flags: insufficientFlags,
        hasIssues: true,
      };
    } else {
      // Priority 3: Normal validation (exceeding_range only for 1-minute storage)
      // Use instrument_only mode - don't validate against regulatory limits
      // Regulatory validation happens when aggregating to 1-hour
      validation = validateParameterValues(readings, "instrument_only");
    }
  }

  // Map parameter names to database field names (water quality)
  const telemetryRecord = await prisma.telemetryProcessed.create({
    data: {
      deviceId,
      observedAt,
      phValue:
        readings.ph !== undefined ? new Prisma.Decimal(readings.ph) : null,
      doValue:
        readings.do !== undefined ? new Prisma.Decimal(readings.do) : null,
      nh3nValue:
        readings.nh3n !== undefined ? new Prisma.Decimal(readings.nh3n) : null,
      codValue:
        readings.cod !== undefined ? new Prisma.Decimal(readings.cod) : null,
      bodValue:
        readings.bod !== undefined ? new Prisma.Decimal(readings.bod) : null,
      tssValue:
        readings.tss !== undefined ? new Prisma.Decimal(readings.tss) : null,
      tempValue:
        readings.temperature !== undefined
          ? new Prisma.Decimal(readings.temperature)
          : null,
      pressureValue:
        readings.pressure !== undefined
          ? new Prisma.Decimal(readings.pressure)
          : null,
      depthValue:
        readings.depth !== undefined ? new Prisma.Decimal(readings.depth) : null,
      dataQuality: validation.hasIssues ? "flagged" : "valid",
      processingFlags: validation.flags as Prisma.InputJsonValue,
      // Pre-calibration values, kept for audit. Only stored when the reading
      // was actually corrected (rawReadings differs from readings upstream).
      rawValues: rawReadings
        ? (rawReadings as Prisma.InputJsonValue)
        : undefined,
    },
  });

  // Create validation status records for flagged parameters
  if (validation.hasIssues) {
    const validationPromises = Object.entries(validation.flags)
      .filter(([_, status]) => status !== "valid")
      .map(([parameter, status]) =>
        prisma.validationStatus.create({
          data: {
            recordId: telemetryRecord.recordId,
            deviceId,
            observedAt,
            parameter,
            status,
            validatedByHuman: false,
            flaggedByHuman: false,
            pendingAdminApproval: false,
          },
        }),
      );

    await Promise.all(validationPromises);
  }

  return telemetryRecord;
};

/**
 * Create multiple telemetry readings (bulk)
 */
export const createReadingsBulk = async (inputs: ReadingInput[]) => {
  const results = await Promise.all(
    inputs.map((input) => createReading(input)),
  );

  return {
    count: results.length,
    data: results,
  };
};
