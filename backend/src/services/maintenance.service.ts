import prisma from "../config/database";

/**
 * Check if a device is in maintenance during a specific time range
 */
export const isDeviceInMaintenance = async (
  deviceId: string,
  timeRange: { start: Date; end: Date }
): Promise<boolean> => {
  const maintenanceLog = await prisma.maintenanceLog.findFirst({
    where: {
      deviceId,
      // Check if time range overlaps with any maintenance period
      OR: [
        {
          // Maintenance period starts during our time range
          AND: [
            { startTime: { lte: timeRange.end } },
            { endTime: { gte: timeRange.start } },
          ],
        },
      ],
    },
  });

  return maintenanceLog !== null;
};

/**
 * Create a new maintenance log entry
 */
export const createMaintenanceLog = async (
  deviceId: string,
  startTime: Date,
  endTime: Date,
  reason?: string,
  description?: string,
  performedBy?: string
) => {
  return await prisma.maintenanceLog.create({
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
 * Get all maintenance logs for a device
 */
export const getMaintenanceLogs = async (
  deviceId: string,
  limit: number = 50
) => {
  return await prisma.maintenanceLog.findMany({
    where: { deviceId },
    orderBy: { startTime: "desc" },
    take: limit,
  });
};

/**
 * Get active maintenance for a device (ongoing maintenance)
 */
export const getActiveMaintenance = async (deviceId: string) => {
  const now = new Date();
  return await prisma.maintenanceLog.findFirst({
    where: {
      deviceId,
      startTime: { lte: now },
      endTime: { gte: now },
    },
  });
};

/**
 * End maintenance early (update endTime to now)
 */
export const endMaintenanceEarly = async (logId: string) => {
  return await prisma.maintenanceLog.update({
    where: { id: logId },
    data: { endTime: new Date() },
  });
};

/**
 * Delete a maintenance log
 */
export const deleteMaintenanceLog = async (logId: string) => {
  return await prisma.maintenanceLog.delete({
    where: { id: logId },
  });
};
