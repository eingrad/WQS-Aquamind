import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../config/database";
import * as auditService from "./audit.service";

interface MinuteDataPoint {
  deviceId: string;
  minuteTimestamp: Date;
  parameter: string;
  value: number | Decimal;
  recordId?: string;
}

interface EvaluationResult {
  alertTriggered: boolean;
  threshold?: any;
  alertHistory?: any;
}

/**
 * Evaluate a single 1-minute aggregated data point against all relevant thresholds
 */
export const evaluateMinuteData = async (
  dataPoint: MinuteDataPoint,
): Promise<EvaluationResult> => {
  const { deviceId, minuteTimestamp, parameter, value, recordId } = dataPoint;

  // Get all enabled thresholds for this parameter
  const thresholds = await prisma.alertThreshold.findMany({
    where: {
      parameter,
      enabled: true,
      OR: [
        { deviceId: deviceId }, // Specific device threshold
        { deviceId: null }, // Global threshold (all devices)
      ],
    },
    orderBy: [
      { deviceId: "desc" }, // Prioritize device-specific over global
      { thresholdType: "desc" }, // Emergency > Critical > Warning
    ],
  });

  if (thresholds.length === 0) {
    return { alertTriggered: false };
  }

  // Evaluate against each threshold
  for (const threshold of thresholds) {
    const actualValue =
      typeof value === "number" ? value : parseFloat(value.toString());
    const thresholdValue = parseFloat(threshold.value.toString());
    const meetsCondition = evaluateCondition(
      actualValue,
      threshold.operator,
      thresholdValue,
    );

    if (meetsCondition) {
      // Check cooldown period
      const isInCooldown = await checkCooldownPeriod(
        threshold.id,
        deviceId,
        threshold.cooldownMinutes,
      );

      if (isInCooldown) {
        console.log(
          `⏳ Alert in cooldown: ${parameter} at ${deviceId}, skipping...`,
        );
        continue;
      }

      // Trigger alert
      const alertHistory = await triggerAlert({
        thresholdId: threshold.id,
        deviceId,
        parameter,
        recordId: recordId || null,
        observedAt: minuteTimestamp,
        actualValue,
        thresholdValue,
        thresholdType: threshold.thresholdType,
      });

      return {
        alertTriggered: true,
        threshold,
        alertHistory,
      };
    }
  }

  return { alertTriggered: false };
};

/**
 * Evaluate 1-minute aggregation for all parameters of a device
 */
export const batchEvaluateParameters = async (
  deviceId: string,
  minuteTimestamp: Date,
  aggregatedData: Record<string, number | Decimal | null>,
) => {
  const results: EvaluationResult[] = [];

  // aggregatedData keys are the canonical parameter names
  // (ph, do, nh3n, cod, bod, tss, temperature, pressure, depth)
  for (const [parameter, value] of Object.entries(aggregatedData)) {
    if (value === null || value === undefined) continue;

    const result = await evaluateMinuteData({
      deviceId,
      minuteTimestamp,
      parameter,
      value,
    });

    if (result.alertTriggered) {
      results.push(result);
    }
  }

  return results;
};

/**
 * Check if an alert is within cooldown period
 */
export const checkCooldownPeriod = async (
  thresholdId: string,
  deviceId: string,
  cooldownMinutes: number,
): Promise<boolean> => {
  const cooldownStart = new Date();
  cooldownStart.setMinutes(cooldownStart.getMinutes() - cooldownMinutes);

  const recentAlert = await prisma.alertHistory.findFirst({
    where: {
      thresholdId,
      deviceId,
      createdAt: {
        gte: cooldownStart,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return recentAlert !== null;
};

/**
 * Trigger an alert and create alert history
 */
export const triggerAlert = async (data: {
  thresholdId: string;
  deviceId: string;
  parameter: string;
  recordId: string | null;
  observedAt: Date;
  actualValue: number;
  thresholdValue: number;
  thresholdType: string;
}) => {
  const {
    thresholdId,
    deviceId,
    parameter,
    recordId,
    observedAt,
    actualValue,
    thresholdValue,
    thresholdType,
  } = data;

  // Create alert history entry
  const alertHistory = await prisma.alertHistory.create({
    data: {
      thresholdId,
      deviceId,
      parameter,
      recordId,
      observedAt,
      actualValue,
      thresholdValue,
      thresholdType,
      acknowledged: false,
    },
    include: {
      threshold: true,
      device: {
        select: {
          deviceCode: true,
          name: true,
          location: true,
        },
      },
    },
  });

  console.log(
    `🚨 Alert triggered: ${thresholdType.toUpperCase()} - ${parameter} = ${actualValue} (threshold: ${thresholdValue}) at ${deviceId}`,
  );

  // Audit logging (non-blocking)
  try {
    await auditService.logAlertTriggered(alertHistory.id, {
      deviceId,
      parameter,
      thresholdType,
      actualValue,
      thresholdValue,
    });
    console.log(`📝 Audit log created for alert ${alertHistory.id}`);
  } catch (error) {
    console.error("❌ Failed to log alert trigger to audit:", error);
    // Don't throw - audit logging shouldn't block alert triggering
  }

  // Note: Notification sending will be handled by notification.service.ts
  // This is called after the alert is created

  return alertHistory;
};

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = async (
  alertHistoryId: string,
  userId: string,
) => {
  const updatedAlert = await prisma.alertHistory.update({
    where: { id: alertHistoryId },
    data: {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
    },
    include: {
      threshold: true,
      device: {
        select: {
          deviceCode: true,
          name: true,
        },
      },
    },
  });

  // Audit logging (non-blocking)
  try {
    await auditService.logAlertAcknowledged(userId, alertHistoryId);
  } catch (error) {
    console.error("Failed to log alert acknowledgment to audit:", error);
    // Don't throw - audit logging shouldn't block the acknowledgment
  }

  return updatedAlert;
};

/**
 * Get alert history with filtering
 */
export const getAlertHistory = async (filters?: {
  deviceId?: string;
  parameter?: string;
  thresholdType?: string;
  acknowledged?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) => {
  const {
    deviceId,
    parameter,
    thresholdType,
    acknowledged,
    startDate,
    endDate,
    limit = 100,
  } = filters || {};

  const alerts = await prisma.alertHistory.findMany({
    where: {
      deviceId,
      parameter,
      thresholdType,
      acknowledged,
      observedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      threshold: true,
      device: {
        select: {
          id: true,
          deviceCode: true,
          name: true,
          location: true,
        },
      },
      acknowledger: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      observedAt: "desc",
    },
    take: limit,
  });

  return alerts;
};

/**
 * Evaluate condition based on operator
 */
function evaluateCondition(
  actualValue: number,
  operator: string,
  thresholdValue: number,
): boolean {
  switch (operator) {
    case ">":
      return actualValue > thresholdValue;
    case "<":
      return actualValue < thresholdValue;
    case ">=":
      return actualValue >= thresholdValue;
    case "<=":
      return actualValue <= thresholdValue;
    case "==":
      return actualValue === thresholdValue;
    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

export default {
  evaluateMinuteData,
  batchEvaluateParameters,
  checkCooldownPeriod,
  triggerAlert,
  acknowledgeAlert,
  getAlertHistory,
};
