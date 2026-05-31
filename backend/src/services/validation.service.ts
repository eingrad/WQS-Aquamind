import prisma from "../config/database";
import { getTimeSeriesData } from "./telemetry/operations/aggregation";
import { expectedReadingsForInterval } from "./telemetry/aggregation/parameter-cadence";

export interface ValidationRecord {
  recordId: string;
  deviceId: string;
  deviceName: string;
  location: string;
  timestamp: string;
  parameters: Record<string, any>;
  dataQuality: string;
}

/**
 * Fetch human validation flags from ValidationStatus table
 */
async function fetchHumanValidationFlags(options: {
  deviceId: string;
  startDate: Date;
  endDate: Date;
}) {
  const { deviceId, startDate, endDate } = options;

  const validationRecords = await prisma.validationStatus.findMany({
    where: {
      deviceId,
      observedAt: {
        gte: startDate,
        lt: endDate,
      },
      flaggedByHuman: true, // Only get human-flagged records
    },
    include: {
      validator: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      observedAt: "asc",
    },
  });

  return validationRecords;
}

/**
 * Get consensus human flag for a given hour and parameter
 * Groups validation records by hour and applies consensus logic
 */
function getHumanFlagsForHour(
  hourTimestamp: string,
  parameter: string,
  allFlags: any[],
) {
  const hourStart = new Date(hourTimestamp);
  const hourEnd = new Date(hourStart);
  hourEnd.setHours(hourEnd.getHours() + 1);

  // Filter flags for this hour and parameter
  const flagsInHour = allFlags.filter((flag) => {
    const flagTime = new Date(flag.observedAt);
    return (
      flag.parameter === parameter &&
      flagTime >= hourStart &&
      flagTime < hourEnd
    );
  });

  if (flagsInHour.length === 0) {
    return null;
  }

  // Priority order (most severe first)
  const flagPriority: Record<string, number> = {
    exceeding_range: 1,
    out_of_range: 2,
    parameter_relation: 3,
    maintenance: 4,
    insufficient_data: 5,
    valid: 6,
  };

  // Find the most severe flag
  const mostSevereFlag = flagsInHour.reduce((prev, curr) => {
    const prevPriority = flagPriority[prev.status] || 99;
    const currPriority = flagPriority[curr.status] || 99;
    return currPriority < prevPriority ? curr : prev;
  });

  // Calculate coverage against this parameter's native cadence (60/hour).
  const totalRecords = flagsInHour.length;
  const expectedRecords = expectedReadingsForInterval(parameter, 3600);

  return {
    status: mostSevereFlag.status,
    flaggedBy: {
      name: mostSevereFlag.validator?.fullName || "Unknown",
      email: mostSevereFlag.validator?.email || "",
    },
    flaggedAt:
      mostSevereFlag.validatedAt?.toISOString() ||
      mostSevereFlag.createdAt.toISOString(),
    remarks: mostSevereFlag.remarks,
    coverage: `${totalRecords}/${expectedRecords} records`,
  };
}

/**
 * Fetch pending approval requests from ApprovalRequest table
 */
async function fetchPendingApprovalRequests(options: {
  deviceId: string;
  startDate: Date;
  endDate: Date;
}) {
  const { deviceId, startDate, endDate } = options;

  const pendingRequests = await prisma.approvalRequest.findMany({
    where: {
      stationId: deviceId,
      adminStatus: "pending",
      timeFrom: {
        gte: startDate,
        lt: endDate,
      },
    },
    include: {
      qcReviewer: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      qcReviewedAt: "desc",
    },
  });

  return pendingRequests;
}

/**
 * Check if a given hour and parameter has a pending approval request
 */
function getPendingApprovalForHour(
  hourTimestamp: string,
  parameter: string,
  allPendingRequests: any[],
) {
  const hourStart = new Date(hourTimestamp);
  const hourEnd = new Date(hourStart);
  hourEnd.setHours(hourEnd.getHours() + 1);

  // Find pending request for this hour and parameter
  const pendingRequest = allPendingRequests.find((request) => {
    const requestStart = new Date(request.timeFrom);
    const requestEnd = new Date(request.timeTo);

    return (
      request.parameterCode === parameter &&
      requestStart <= hourStart &&
      requestEnd >= hourEnd
    );
  });

  if (!pendingRequest) {
    return null;
  }

  return {
    isPending: true,
    requestedBy: {
      name: pendingRequest.qcReviewer?.fullName || "Unknown",
      email: pendingRequest.qcReviewer?.email || "",
    },
    requestedAt: pendingRequest.qcReviewedAt?.toISOString(),
    remarks: pendingRequest.qcRemarks,
    flagType: pendingRequest.flagType,
  };
}

/**
 * Get 1-hour aggregated validation table data
 * Returns hourly averages validated against Malaysia regulatory standards
 */
export const getValidationTableData = async (options: {
  deviceId: string;
  startDate: Date;
  endDate: Date;
  page?: number;
  limit?: number;
}) => {
  const { deviceId, startDate, endDate, page = 1, limit = 100 } = options;

  // Get device info
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    select: { name: true, location: true },
  });

  if (!device) {
    throw new Error(`Device ${deviceId} not found`);
  }

  // Get 1-hour aggregated data with validation
  const aggregated = await getTimeSeriesData({
    deviceId,
    startDate,
    endDate,
    interval: "1h",
    parameters: "ph,do,nh3n,cod,bod,tss,temperature,pressure,depth",
  });

  // Fetch human validation flags for the date range
  const humanFlags = await fetchHumanValidationFlags({
    deviceId,
    startDate,
    endDate,
  });

  // Fetch pending approval requests to show pending indicators
  const pendingRequests = await fetchPendingApprovalRequests({
    deviceId,
    startDate,
    endDate,
  });

  // Apply pagination
  const total = aggregated.length;
  const start = (page - 1) * limit;
  const paginatedData = aggregated.slice(start, start + limit);

  // Transform to validation table format
  const records: ValidationRecord[] = paginatedData.map((row: any) => ({
    recordId: `hourly-${row.bucket}`,
    timestamp: row.bucket,
    deviceId,
    deviceName: device.name,
    location: device.location,
    parameters: {
      ph: {
        value: row.ph_avg !== null ? Number(row.ph_avg) : null,
        unit: "pH",
        autoFlag: row.validation_flags?.ph || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "ph", humanFlags),
        pendingApproval: getPendingApprovalForHour(row.bucket, "ph", pendingRequests),
      },
      do: {
        value: row.do_avg !== null ? Number(row.do_avg) : null,
        unit: "mg/L",
        autoFlag: row.validation_flags?.do || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "do", humanFlags),
        pendingApproval: getPendingApprovalForHour(row.bucket, "do", pendingRequests),
      },
      nh3n: {
        value: row.nh3n_avg !== null ? Number(row.nh3n_avg) : null,
        unit: "mg/L",
        autoFlag: row.validation_flags?.nh3n || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "nh3n", humanFlags),
        pendingApproval: getPendingApprovalForHour(row.bucket, "nh3n", pendingRequests),
      },
      cod: {
        value: row.cod_avg !== null ? Number(row.cod_avg) : null,
        unit: "mg/L",
        autoFlag: row.validation_flags?.cod || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "cod", humanFlags),
        pendingApproval: getPendingApprovalForHour(row.bucket, "cod", pendingRequests),
      },
      bod: {
        value: row.bod_avg !== null ? Number(row.bod_avg) : null,
        unit: "mg/L",
        autoFlag: row.validation_flags?.bod || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "bod", humanFlags),
        pendingApproval: getPendingApprovalForHour(row.bucket, "bod", pendingRequests),
      },
      tss: {
        value: row.tss_avg !== null ? Number(row.tss_avg) : null,
        unit: "mg/L",
        autoFlag: row.validation_flags?.tss || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "tss", humanFlags),
        pendingApproval: getPendingApprovalForHour(row.bucket, "tss", pendingRequests),
      },
      temperature: {
        value: row.temperature_avg !== null ? Number(row.temperature_avg) : null,
        unit: "°C",
        autoFlag: row.validation_flags?.temperature || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "temperature", humanFlags),
        pendingApproval: getPendingApprovalForHour(row.bucket, "temperature", pendingRequests),
      },
      pressure: {
        value: row.pressure_avg !== null ? Number(row.pressure_avg) : null,
        unit: "kPa",
        autoFlag: row.validation_flags?.pressure || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "pressure", humanFlags),
        pendingApproval: getPendingApprovalForHour(row.bucket, "pressure", pendingRequests),
      },
      depth: {
        value: row.depth_avg !== null ? Number(row.depth_avg) : null,
        unit: "m",
        autoFlag: row.validation_flags?.depth || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "depth", humanFlags),
        pendingApproval: getPendingApprovalForHour(row.bucket, "depth", pendingRequests),
      },
    },
    dataQuality: row.data_quality || "valid",
  }));

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export default {
  getValidationTableData,
};

// Force reload: 01/14/2026 12:28:12
