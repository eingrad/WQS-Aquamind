/**
 * Telemetry Query Operations
 */

import prisma from "../../../config/database";

interface QueryOptions {
  page?: number;
  limit?: number;
  deviceId?: string;
  parameter?: string;
  dataQuality?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Get telemetry readings with filtering and pagination
 */
export const getReadings = async (options: QueryOptions) => {
  const { page = 1, limit = 100, deviceId, startDate, endDate } = options;

  const where: any = {};

  if (deviceId) where.deviceId = deviceId;
  if (startDate && endDate) {
    where.receivedAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  const [data, total] = await Promise.all([
    prisma.telemetryRaw.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.telemetryRaw.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single reading by rawId
 */
export const getReadingById = async (id: string) => {
  const reading = await prisma.telemetryRaw.findUnique({
    where: { rawId: id },
  });

  if (!reading) {
    throw new Error("Reading not found");
  }

  return reading;
};

/**
 * Get latest readings
 */
export const getLatestReadings = async (
  deviceId?: string,
  limit: number = 10
) => {
  const where = deviceId ? { deviceId } : {};

  return await prisma.telemetryRaw.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    take: limit,
  });
};

/**
 * Get the most recent reading for a device (for activity check)
 */
export const getLatestReading = async (deviceId: string) => {
  return await prisma.telemetryProcessed.findFirst({
    where: { deviceId },
    orderBy: { observedAt: "desc" },
    select: { observedAt: true },
  });
};
