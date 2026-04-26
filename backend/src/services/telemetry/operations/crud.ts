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
  dataCounts?: Record<string, number>; // Optional: count of 5s readings per parameter
}

/**
 * Create a single telemetry reading
 */
export const createReading = async (input: ReadingInput) => {
  const { deviceId, observedAt, readings, dataCounts } = input;

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

  // Map frontend parameter names to database field names
  const telemetryRecord = await prisma.telemetryProcessed.create({
    data: {
      deviceId,
      observedAt,
      so2Value:
        readings.so2 !== undefined ? new Prisma.Decimal(readings.so2) : null,
      h2sValue:
        readings.h2s !== undefined ? new Prisma.Decimal(readings.h2s) : null,
      no2Value:
        readings.no2 !== undefined ? new Prisma.Decimal(readings.no2) : null,
      noValue:
        readings.no !== undefined ? new Prisma.Decimal(readings.no) : null,
      noxValue:
        readings.nox !== undefined ? new Prisma.Decimal(readings.nox) : null,
      btexValue:
        readings.btex !== undefined ? new Prisma.Decimal(readings.btex) : null,
      tempValue:
        readings.temperature !== undefined
          ? new Prisma.Decimal(readings.temperature)
          : null,
      humidityValue:
        readings.humidity !== undefined
          ? new Prisma.Decimal(readings.humidity)
          : null,
      wsValue:
        readings.windSpeed !== undefined
          ? new Prisma.Decimal(readings.windSpeed)
          : null,
      wdValue:
        readings.windDirection !== undefined
          ? new Prisma.Decimal(readings.windDirection)
          : null,
      solarValue:
        readings.solar !== undefined
          ? new Prisma.Decimal(readings.solar)
          : null,
      pressureValue:
        readings.pressure !== undefined
          ? new Prisma.Decimal(readings.pressure)
          : null,
      rainValue:
        readings.rain !== undefined ? new Prisma.Decimal(readings.rain) : null,
      dataQuality: validation.hasIssues ? "flagged" : "valid",
      processingFlags: validation.flags as Prisma.InputJsonValue, // Store all validation flags
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
        })
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
    inputs.map((input) => createReading(input))
  );

  return {
    count: results.length,
    data: results,
  };
};
