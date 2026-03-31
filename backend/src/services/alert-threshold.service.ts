import prisma from "../config/database";
import * as auditService from "./audit.service";

interface CreateThresholdParams {
  deviceId?: string;
  parameter: string;
  thresholdType: "warning" | "critical" | "emergency";
  operator: ">" | "<" | ">=" | "<=" | "==";
  value: number;
  cooldownMinutes?: number;
  createdBy: string;
}

interface UpdateThresholdParams {
  deviceId?: string;
  parameter?: string;
  thresholdType?: "warning" | "critical" | "emergency";
  operator?: ">" | "<" | ">=" | "<=" | "==";
  value?: number;
  cooldownMinutes?: number;
}

/**
 * Create a new alert threshold (admin only)
 */
export const createThreshold = async (params: CreateThresholdParams) => {
  const {
    deviceId,
    parameter,
    thresholdType,
    operator,
    value,
    cooldownMinutes = 60,
    createdBy,
  } = params;

  const threshold = await prisma.alertThreshold.create({
    data: {
      deviceId,
      parameter,
      thresholdType,
      operator,
      value,
      cooldownMinutes,
      createdBy,
    },
    include: {
      device: {
        select: {
          deviceCode: true,
          name: true,
        },
      },
      creator: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  });

  // Audit logging
  await auditService.logThresholdCreated(createdBy, threshold.id, {
    deviceId: deviceId || "all",
    parameter,
    thresholdType,
    operator,
    value: value.toString(),
    cooldownMinutes,
  });

  return threshold;
};

/**
 * Update an existing threshold
 */
export const updateThreshold = async (
  thresholdId: string,
  params: UpdateThresholdParams,
  updatedBy: string,
) => {
  // Get old values for audit logging
  const oldThreshold = await prisma.alertThreshold.findUnique({
    where: { id: thresholdId },
  });

  if (!oldThreshold) {
    throw new Error("Threshold not found");
  }

  const updatedThreshold = await prisma.alertThreshold.update({
    where: { id: thresholdId },
    data: params,
    include: {
      device: {
        select: {
          deviceCode: true,
          name: true,
        },
      },
    },
  });

  // Audit logging with changes
  const changes: { field: string; oldValue: any; newValue: any }[] = [];

  if (params.parameter && params.parameter !== oldThreshold.parameter) {
    changes.push({
      field: "parameter",
      oldValue: oldThreshold.parameter,
      newValue: params.parameter,
    });
  }

  if (
    params.thresholdType &&
    params.thresholdType !== oldThreshold.thresholdType
  ) {
    changes.push({
      field: "thresholdType",
      oldValue: oldThreshold.thresholdType,
      newValue: params.thresholdType,
    });
  }

  if (params.operator && params.operator !== oldThreshold.operator) {
    changes.push({
      field: "operator",
      oldValue: oldThreshold.operator,
      newValue: params.operator,
    });
  }

  if (
    params.value !== undefined &&
    params.value.toString() !== oldThreshold.value.toString()
  ) {
    changes.push({
      field: "value",
      oldValue: oldThreshold.value.toString(),
      newValue: params.value.toString(),
    });
  }

  await auditService.logThresholdUpdated(updatedBy, thresholdId, changes);

  return updatedThreshold;
};

/**
 * Delete a threshold
 * This will also delete all related alert history and notifications
 */
export const deleteThreshold = async (
  thresholdId: string,
  deletedBy: string,
) => {
  const threshold = await prisma.alertThreshold.findUnique({
    where: { id: thresholdId },
    include: {
      device: {
        select: {
          deviceCode: true,
          name: true,
        },
      },
      alertHistory: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!threshold) {
    throw new Error("Threshold not found");
  }

  // Delete notifications → alertHistory → threshold atomically.
  // If any step fails the entire operation is rolled back.
  await prisma.$transaction(async (tx) => {
    // Step 1: delete notifications linked to this threshold's alert history
    if (threshold.alertHistory.length > 0) {
      const alertHistoryIds = threshold.alertHistory.map((ah) => ah.id);

      await tx.notification.deleteMany({
        where: {
          alertHistoryId: {
            in: alertHistoryIds,
          },
        },
      });

      // Step 2: delete the alert history records
      await tx.alertHistory.deleteMany({
        where: { thresholdId },
      });
    }

    // Step 3: delete the threshold itself
    await tx.alertThreshold.delete({
      where: { id: thresholdId },
    });
  });

  // Audit logging
  await auditService.logThresholdDeleted(deletedBy, thresholdId, {
    deviceId: threshold.deviceId || "all",
    parameter: threshold.parameter,
    thresholdType: threshold.thresholdType,
    operator: threshold.operator,
    value: threshold.value.toString(),
  });

  console.log(
    `🗑️  Deleted threshold ${thresholdId} and ${threshold.alertHistory.length} related alert history records`,
  );

  return {
    deleted: true,
    threshold,
    deletedAlertHistoryCount: threshold.alertHistory.length,
  };
};

/**
 * Get all thresholds with optional filtering
 */
export const getThresholds = async (filters?: {
  deviceId?: string;
  parameter?: string;
  enabled?: boolean;
}) => {
  const thresholds = await prisma.alertThreshold.findMany({
    where: {
      deviceId: filters?.deviceId,
      parameter: filters?.parameter,
      enabled: filters?.enabled,
    },
    include: {
      device: {
        select: {
          id: true,
          deviceCode: true,
          name: true,
          location: true,
        },
      },
      creator: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: [{ parameter: "asc" }, { thresholdType: "asc" }],
  });

  return thresholds;
};

/**
 * Get single threshold by ID
 */
export const getThresholdById = async (thresholdId: string) => {
  const threshold = await prisma.alertThreshold.findUnique({
    where: { id: thresholdId },
    include: {
      device: {
        select: {
          id: true,
          deviceCode: true,
          name: true,
          location: true,
        },
      },
      creator: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!threshold) {
    throw new Error("Threshold not found");
  }

  return threshold;
};

/**
 * Get thresholds for a specific parameter
 */
export const getThresholdsByParameter = async (
  parameter: string,
  enabled: boolean = true,
) => {
  return await prisma.alertThreshold.findMany({
    where: {
      parameter,
      enabled,
    },
    include: {
      device: {
        select: {
          id: true,
          deviceCode: true,
          name: true,
        },
      },
    },
    orderBy: { value: "asc" },
  });
};

/**
 * Enable or disable a threshold
 */
export const toggleThreshold = async (
  thresholdId: string,
  enabled: boolean,
  toggledBy: string,
) => {
  const threshold = await prisma.alertThreshold.update({
    where: { id: thresholdId },
    data: { enabled },
  });

  // Audit logging
  if (enabled) {
    await auditService.logThresholdEnabled(toggledBy, thresholdId);
  } else {
    await auditService.logThresholdDisabled(toggledBy, thresholdId);
  }

  return threshold;
};

export default {
  createThreshold,
  updateThreshold,
  deleteThreshold,
  getThresholds,
  getThresholdById,
  getThresholdsByParameter,
  toggleThreshold,
};
