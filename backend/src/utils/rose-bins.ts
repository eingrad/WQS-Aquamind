/**
 * Shared bin definitions for wind rose and pollution rose histograms.
 * Used by both the live MQTT accumulator and the on-demand 1h/1d
 * histogram queries so all three modes return identical bucket shapes.
 */

export const COMPASS_DIRECTIONS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

export const WIND_SPEED_BINS = ["0-2", "2-5", "5-10", "10-15", "15+"];
export const POLLUTION_BINS = ["low", "moderate", "high", "very_high"];

/**
 * Per-parameter pollution rose bin thresholds (all values in ppb).
 * Tuple format: [moderateMin, highMin, veryHighMin]
 */
const CONCENTRATION_BINS: Record<string, [number, number, number]> = {
  so2: [20, 50, 100],
  h2s: [3, 30, 100],
  no: [50, 100, 200],
  no2: [50, 100, 200],
  nox: [100, 200, 400],
  benzene: [0.5, 1.0, 2.3],
  toluene: [50, 200, 400],
  ethylbenzene: [50, 200, 460],
  xylenes: [100, 350, 700],
};

/** Convert wind direction in degrees (0-360) to a 16-point compass label. */
export const degreesToCompass = (degrees: number): string => {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_DIRECTIONS[index];
};

/** Classify wind speed (m/s) into a bin label. */
export const getSpeedBin = (speed: number): string => {
  if (speed < 2) return "0-2";
  if (speed < 5) return "2-5";
  if (speed < 10) return "5-10";
  if (speed < 15) return "10-15";
  return "15+";
};

/** Classify pollutant concentration (ppb) into a 4-tier bin for the parameter. */
export const getConcentrationBin = (parameter: string, value: number): string => {
  const thresholds = CONCENTRATION_BINS[parameter.toLowerCase()] ?? [
    20, 50, 100,
  ];
  const [mod, high, vhigh] = thresholds;
  if (value < mod) return "low";
  if (value < high) return "moderate";
  if (value < vhigh) return "high";
  return "very_high";
};

/** Build an empty histogram with all directions × bins zeroed out. */
export const emptyHistogram = (
  bins: readonly string[],
): Record<string, Record<string, number>> => {
  const out: Record<string, Record<string, number>> = {};
  for (const dir of COMPASS_DIRECTIONS) {
    out[dir] = {};
    for (const bin of bins) out[dir][bin] = 0;
  }
  return out;
};
