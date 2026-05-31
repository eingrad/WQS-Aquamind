/**
 * Per-parameter native sensor reporting cadence.
 *
 * All water quality sensors report one pre-averaged reading per minute
 * (60 readings/hour). Availability and data-quality calculations compare
 * each parameter's reading count against this cadence.
 */

export const PARAMETER_READINGS_PER_HOUR: Record<string, number> = {
  ph:          60,
  do:          60,
  nh3n:        60,
  cod:         60,
  bod:         60,
  tss:         60,
  temperature: 60,
  pressure:    60,
  depth:       60,
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
