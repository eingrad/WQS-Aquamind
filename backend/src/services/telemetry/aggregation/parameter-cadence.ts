/**
 * Per-parameter native sensor reporting cadence.
 *
 * The Synspec GC955 produces a BTEX measurement every ~15 minutes
 * (chromatography cycle = 4 readings/hour). Every other instrument on the
 * station reports every minute (60 readings/hour). Availability and
 * data-quality calculations must compare each parameter's reading count
 * against its own native cadence — not a global "60 per hour" assumption.
 */

export const PARAMETER_READINGS_PER_HOUR: Record<string, number> = {
  // 1-minute analyzers
  so2: 60,
  h2s: 60,
  no2: 60,
  no: 60,
  nox: 60,

  // GC955 BTEX — 15-minute chromatography cycle
  benzene: 4,
  toluene: 4,
  ethylbenzene: 4,
  xylenes: 4,

  // 1-minute meteorological
  temperature: 60,
  humidity: 60,
  pressure: 60,
  windSpeed: 60,
  windDirection: 60,
  solar: 60,
  rain: 60,
};

/** Expected reading count for a parameter over an arbitrary interval. */
export const expectedReadingsForInterval = (
  param: string,
  intervalSeconds: number,
): number => {
  const perHour = PARAMETER_READINGS_PER_HOUR[param] ?? 60;
  return Math.round(perHour * (intervalSeconds / 3600));
};

/**
 * Convenience: the SQL count column name for a parameter, matching the
 * `<param>_count` columns emitted by the aggregation query.
 */
export const countColumnForParam = (param: string): string =>
  `${param.toLowerCase()}_count`;
