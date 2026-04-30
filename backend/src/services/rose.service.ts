import prisma from "../config/database";
import {
  WIND_SPEED_BINS,
  POLLUTION_BINS,
  degreesToCompass,
  getSpeedBin,
  getConcentrationBin,
  emptyHistogram,
} from "../utils/rose-bins";

export interface RoseHistogram {
  timestamp: string;
  deviceId: string;
  directions: Record<string, Record<string, number>>;
  /** number of underlying readings (non-null direction + value) */
  count: number;
}

export interface PollutionRoseHistogram extends RoseHistogram {
  parameter: string;
}

const PARAM_TO_COLUMN: Record<string, string> = {
  SO2: "so2Value",
  H2S: "h2sValue",
  NO2: "no2Value",
  NO: "noValue",
  NOX: "noxValue",
  BENZENE: "benzeneValue",
  TOLUENE: "tolueneValue",
  ETHYLBENZENE: "ethylbenzeneValue",
  XYLENES: "xylenesValue",
};

/**
 * Build a wind-rose histogram (16 directions × speed bins) from
 * telemetry_processed rows in the [now - hours, now] window.
 */
export const getWindRoseHistogram = async (
  deviceId: string,
  hours: number,
): Promise<RoseHistogram> => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const rows = await prisma.telemetryProcessed.findMany({
    where: {
      deviceId,
      observedAt: { gte: since },
      wsValue: { not: null },
      wdValue: { not: null },
    },
    select: { wsValue: true, wdValue: true },
  });

  const directions = emptyHistogram(WIND_SPEED_BINS);
  let count = 0;

  for (const row of rows) {
    const ws = row.wsValue == null ? null : Number(row.wsValue);
    const wd = row.wdValue == null ? null : Number(row.wdValue);
    if (ws === null || wd === null) continue;

    const dir = degreesToCompass(wd);
    const bin = getSpeedBin(ws);
    directions[dir][bin]++;
    count++;
  }

  return {
    timestamp: new Date().toISOString(),
    deviceId,
    directions,
    count,
  };
};

/**
 * Build a pollution-rose histogram (16 directions × concentration bins)
 * from telemetry_processed rows in the [now - hours, now] window.
 */
export const getPollutionRoseHistogram = async (
  deviceId: string,
  parameter: string,
  hours: number,
): Promise<PollutionRoseHistogram> => {
  const paramKey = parameter.toUpperCase();
  const column = PARAM_TO_COLUMN[paramKey];
  if (!column) {
    throw new Error(`Unsupported pollution rose parameter: ${parameter}`);
  }

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const rows = await prisma.telemetryProcessed.findMany({
    where: {
      deviceId,
      observedAt: { gte: since },
      wdValue: { not: null },
      [column]: { not: null },
    } as any,
    select: { wdValue: true, [column]: true } as any,
  });

  const directions = emptyHistogram(POLLUTION_BINS);
  let count = 0;
  const paramLower = paramKey.toLowerCase();

  for (const row of rows as any[]) {
    const wd = row.wdValue == null ? null : Number(row.wdValue);
    const value = row[column] == null ? null : Number(row[column]);
    if (wd === null || value === null) continue;

    const dir = degreesToCompass(wd);
    const bin = getConcentrationBin(paramLower, value);
    directions[dir][bin]++;
    count++;
  }

  return {
    timestamp: new Date().toISOString(),
    deviceId,
    parameter: paramKey,
    directions,
    count,
  };
};
