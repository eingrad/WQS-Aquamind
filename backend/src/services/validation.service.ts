import prisma from "../config/database";
import { getTimeSeriesData } from "./telemetry/operations/aggregation";

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

  // Calculate coverage
  const totalRecords = flagsInHour.length;

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
    coverage: `${totalRecords}/60 records`,
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
    parameters:
      "so2,h2s,no2,benzene,toluene,ethylbenzene,xylenes,windSpeed,windDirection,temperature,humidity,pressure,solar,rain",
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
      so2: {
        value: row.so2_avg !== null ? Number(row.so2_avg) : null,
        unit: "ppb",
        autoFlag: row.validation_flags?.so2 || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "so2", humanFlags),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "so2",
          pendingRequests,
        ),
      },
      h2s: {
        value: row.h2s_avg !== null ? Number(row.h2s_avg) : null,
        unit: "ppb",
        autoFlag: row.validation_flags?.h2s || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "h2s", humanFlags),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "h2s",
          pendingRequests,
        ),
      },
      no2: {
        value: row.no2_avg !== null ? Number(row.no2_avg) : null,
        unit: "ppb",
        autoFlag: row.validation_flags?.no2 || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "no2", humanFlags),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "no2",
          pendingRequests,
        ),
      },
      benzene: {
        value: row.benzene_avg !== null ? Number(row.benzene_avg) : null,
        unit: "ppb",
        autoFlag: row.validation_flags?.benzene || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "benzene", humanFlags),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "benzene",
          pendingRequests,
        ),
      },
      toluene: {
        value: row.toluene_avg !== null ? Number(row.toluene_avg) : null,
        unit: "ppb",
        autoFlag: row.validation_flags?.toluene || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "toluene", humanFlags),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "toluene",
          pendingRequests,
        ),
      },
      ethylbenzene: {
        value:
          row.ethylbenzene_avg !== null ? Number(row.ethylbenzene_avg) : null,
        unit: "ppb",
        autoFlag: row.validation_flags?.ethylbenzene || "valid",
        humanValidation: getHumanFlagsForHour(
          row.bucket,
          "ethylbenzene",
          humanFlags,
        ),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "ethylbenzene",
          pendingRequests,
        ),
      },
      xylenes: {
        value: row.xylenes_avg !== null ? Number(row.xylenes_avg) : null,
        unit: "ppb",
        autoFlag: row.validation_flags?.xylenes || "valid",
        humanValidation: getHumanFlagsForHour(
          row.bucket,
          "xylenes",
          humanFlags,
        ),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "xylenes",
          pendingRequests,
        ),
      },
      windSpeed: {
        value:
          row["windspeed_avg"] !== null ? Number(row["windspeed_avg"]) : null,
        unit: "km/h",
        autoFlag: row.validation_flags?.windSpeed || "valid",
        humanValidation: getHumanFlagsForHour(
          row.bucket,
          "windSpeed",
          humanFlags,
        ),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "windSpeed",
          pendingRequests,
        ),
      },
      windDirection: {
        value:
          row["winddirection_avg"] !== null
            ? Number(row["winddirection_avg"])
            : null,
        unit: "°",
        autoFlag: row.validation_flags?.windDirection || "valid",
        humanValidation: getHumanFlagsForHour(
          row.bucket,
          "windDirection",
          humanFlags,
        ),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "windDirection",
          pendingRequests,
        ),
      },
      temperature: {
        value:
          row.temperature_avg !== null ? Number(row.temperature_avg) : null,
        unit: "°C",
        autoFlag: row.validation_flags?.temperature || "valid",
        humanValidation: getHumanFlagsForHour(
          row.bucket,
          "temperature",
          humanFlags,
        ),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "temperature",
          pendingRequests,
        ),
      },
      humidity: {
        value: row.humidity_avg !== null ? Number(row.humidity_avg) : null,
        unit: "%",
        autoFlag: row.validation_flags?.humidity || "valid",
        humanValidation: getHumanFlagsForHour(
          row.bucket,
          "humidity",
          humanFlags,
        ),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "humidity",
          pendingRequests,
        ),
      },
      pressure: {
        value: row.pressure_avg !== null ? Number(row.pressure_avg) : null,
        unit: "hPa",
        autoFlag: row.validation_flags?.pressure || "valid",
        humanValidation: getHumanFlagsForHour(
          row.bucket,
          "pressure",
          humanFlags,
        ),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "pressure",
          pendingRequests,
        ),
      },
      solar: {
        value: row.solar_avg !== null ? Number(row.solar_avg) : null,
        unit: "W/m²",
        autoFlag: row.validation_flags?.solar || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "solar", humanFlags),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "solar",
          pendingRequests,
        ),
      },
      rain: {
        value: row.rain_avg !== null ? Number(row.rain_avg) : null,
        unit: "mm",
        autoFlag: row.validation_flags?.rain || "valid",
        humanValidation: getHumanFlagsForHour(row.bucket, "rain", humanFlags),
        pendingApproval: getPendingApprovalForHour(
          row.bucket,
          "rain",
          pendingRequests,
        ),
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
