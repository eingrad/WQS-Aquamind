import prisma from "../config/database";

/**
 * Check if a device is in maintenance during a specific time range.
 * Ignores soft-deleted maintenance windows.
 */
export const isDeviceInMaintenance = async (
  deviceId: string,
  timeRange: { start: Date; end: Date }
): Promise<boolean> => {
  const maintenanceLog = await prisma.maintenanceLog.findFirst({
    where: {
      deviceId,
      deletedAt: null,
      // Standard interval-overlap test
      AND: [
        { startTime: { lte: timeRange.end } },
        { endTime: { gte: timeRange.start } },
      ],
    },
  });

  return maintenanceLog !== null;
};

/**
 * Find any active (non-deleted) maintenance window for `deviceId` whose
 * range overlaps [startTime, endTime]. Returns the matching log if found,
 * excluding the row identified by `excludeId` (used for update flows).
 */
export const findOverlappingMaintenance = async (
  deviceId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string
) => {
  return prisma.maintenanceLog.findFirst({
    where: {
      deviceId,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
      AND: [
        { startTime: { lte: endTime } },
        { endTime: { gte: startTime } },
      ],
    },
  });
};

/**
 * Create a new maintenance log entry. Validates time order and rejects
 * overlapping windows for the same device.
 */
export const createMaintenanceLog = async (
  deviceId: string,
  startTime: Date,
  endTime: Date,
  reason?: string,
  description?: string,
  performedBy?: string
) => {
  if (endTime.getTime() <= startTime.getTime()) {
    throw new Error("endTime must be after startTime");
  }

  const overlap = await findOverlappingMaintenance(deviceId, startTime, endTime);
  if (overlap) {
    throw new Error(
      `Maintenance window overlaps an existing one (${overlap.id})`
    );
  }

  return prisma.maintenanceLog.create({
    data: {
      deviceId,
      startTime,
      endTime,
      reason,
      description,
      performedBy,
    },
  });
};

/**
 * Get maintenance logs for a device. Excludes soft-deleted rows.
 */
export const getMaintenanceLogs = async (
  deviceId: string,
  limit: number = 50
) => {
  return prisma.maintenanceLog.findMany({
    where: { deviceId, deletedAt: null },
    orderBy: { startTime: "desc" },
    take: limit,
  });
};

/**
 * Get all maintenance logs across all devices. Excludes soft-deleted rows.
 */
export const getAllMaintenanceLogs = async (limit: number = 200) => {
  return prisma.maintenanceLog.findMany({
    where: { deletedAt: null },
    include: {
      device: {
        select: {
          id: true,
          deviceCode: true,
          name: true,
          location: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
    take: limit,
  });
};

/**
 * Get active maintenance for a device (ongoing maintenance).
 */
export const getActiveMaintenance = async (deviceId: string) => {
  const now = new Date();
  return prisma.maintenanceLog.findFirst({
    where: {
      deviceId,
      deletedAt: null,
      startTime: { lte: now },
      endTime: { gte: now },
    },
  });
};

/**
 * End maintenance early (update endTime to now).
 */
export const endMaintenanceEarly = async (logId: string) => {
  return prisma.maintenanceLog.update({
    where: { id: logId },
    data: { endTime: new Date() },
  });
};

/**
 * Soft-delete a maintenance log. The record stays in the table for audit
 * but is filtered out of all aggregation/reporting queries.
 */
export const deleteMaintenanceLog = async (logId: string) => {
  return prisma.maintenanceLog.update({
    where: { id: logId },
    data: { deletedAt: new Date() },
  });
};
