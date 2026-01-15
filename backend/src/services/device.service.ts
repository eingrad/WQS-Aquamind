import prisma from "../config/database";
import { ConflictError, NotFoundError } from "../utils/errors";

/**
 * Get all devices with pagination and filtering
 */
export const getAllDevices = async (options: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  const { page = 1, limit = 10, status, search } = options;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { deviceCode: { contains: search, mode: "insensitive" } },
    ];
  }

  const [devices, total] = await Promise.all([
    prisma.device.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.device.count({ where }),
  ]);

  return {
    devices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get device by ID
 */
export const getDeviceById = async (deviceId: string) => {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
  });

  if (!device) {
    throw new NotFoundError("Device not found");
  }

  return device;
};

/**
 * Get device by device code
 */
export const getDeviceByCode = async (deviceCode: string) => {
  const device = await prisma.device.findUnique({
    where: { deviceCode },
  });

  if (!device) {
    throw new NotFoundError("Device not found");
  }

  return device;
};

/**
 * Create a new device
 */
export const createDevice = async (data: {
  deviceCode: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}) => {
  // Check if device code already exists
  const existing = await prisma.device.findUnique({
    where: { deviceCode: data.deviceCode },
  });

  if (existing) {
    throw new ConflictError(
      `Device with code ${data.deviceCode} already exists`
    );
  }

  const device = await prisma.device.create({
    data: {
      deviceCode: data.deviceCode,
      name: data.name,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      status: data.status || "active",
    },
  });

  return device;
};

/**
 * Update device
 */
export const updateDevice = async (
  deviceId: string,
  data: {
    name?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
  }
) => {
  // Check if device exists
  await getDeviceById(deviceId);

  const device = await prisma.device.update({
    where: { id: deviceId },
    data: {
      name: data.name,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      status: data.status,
    },
  });

  return device;
};

/**
 * Delete device
 */
export const deleteDevice = async (deviceId: string) => {
  // Check if device exists
  await getDeviceById(deviceId);

  await prisma.device.delete({
    where: { id: deviceId },
  });

  return { message: "Device deleted successfully", deviceId };
};

/**
 * Get device statistics
 */
export const getDeviceStats = async () => {
  const [total, active, inactive, maintenance] = await Promise.all([
    prisma.device.count(),
    prisma.device.count({ where: { status: "active" } }),
    prisma.device.count({ where: { status: "inactive" } }),
    prisma.device.count({ where: { status: "maintenance" } }),
  ]);

  return {
    total,
    active,
    inactive,
    maintenance,
  };
};
