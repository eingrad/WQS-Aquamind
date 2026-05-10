/**
 * AQI (Air Quality Index) Ranges and Types
 * Based on Malaysian API (Air Pollutant Index) standards from Department of Environment
 *
 * Ranges are stored in the parameter's BASE unit (ppb for gases, W/m² for
 * solar). The display layer (ExposureLimitsDisplay) converts each range
 * to the user's selected unit at render time so the threshold table
 * always matches the chart's axis unit.
 */

export type AQIRange = {
  category: string;
  min: number;
  /** Upper bound. `null` means the range has no upper limit (Hazardous). */
  max: number | null;
  color: string;
  bgColor: string;
};

export type ExposureRangeData = {
  /** Storage unit for min/max — the display layer converts to user's unit. */
  baseUnit: string;
  ranges: AQIRange[];
};

/**
 * Official Malaysian API breakpoints and exposure limits for various pollutants
 *
 * Categories:
 * - Good (0-50)
 * - Moderate (51-100)
 * - Unhealthy (101-200)
 * - Very Unhealthy (201-300)
 * - Hazardous (301-500)
 */
export const EXPOSURE_RANGES: Record<string, ExposureRangeData | null> = {
  // SO₂ - 24-hour average (Official Malaysian API). Original µg/m³
  // breakpoints (94.31, 199.13, 799.07, 1248.12) converted to ppb at 25 °C
  // / 1 atm using MW=64.07 g/mol — gives ~36, 76, 305, 476 ppb.
  so2: {
    baseUnit: "ppb",
    ranges: [
      { category: "Good", min: 0, max: 36, color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" },
      { category: "Moderate", min: 36, max: 76, color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.1)" },
      { category: "Unhealthy", min: 76, max: 305, color: "#eab308", bgColor: "rgba(234, 179, 8, 0.1)" },
      { category: "Very Unhealthy", min: 305, max: 476, color: "#f97316", bgColor: "rgba(249, 115, 22, 0.1)" },
      { category: "Hazardous", min: 476, max: null, color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)" },
    ],
  },
  // H₂S - Occupational exposure limits (ACGIH TLV)
  h2s: {
    baseUnit: "ppb",
    ranges: [
      { category: "Good", min: 0, max: 3, color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" },
      { category: "Moderate", min: 3, max: 30, color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.1)" },
      { category: "Unhealthy", min: 30, max: 1000, color: "#eab308", bgColor: "rgba(234, 179, 8, 0.1)" },
      { category: "Very Unhealthy", min: 1000, max: 10000, color: "#f97316", bgColor: "rgba(249, 115, 22, 0.1)" },
      { category: "Hazardous", min: 10000, max: null, color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)" },
    ],
  },
  // NO₂ - 1-hour average (Official Malaysian API, in ppb)
  no2: {
    baseUnit: "ppb",
    ranges: [
      { category: "Good", min: 0, max: 50, color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" },
      { category: "Moderate", min: 50, max: 100, color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.1)" },
      { category: "Unhealthy", min: 100, max: 650, color: "#eab308", bgColor: "rgba(234, 179, 8, 0.1)" },
      { category: "Very Unhealthy", min: 650, max: 1250, color: "#f97316", bgColor: "rgba(249, 115, 22, 0.1)" },
      { category: "Hazardous", min: 1250, max: null, color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)" },
    ],
  },
  // Benzene — Ontario AAQC 24-hr = 2.3 ppb
  benzene: {
    baseUnit: "ppb",
    ranges: [
      { category: "Good", min: 0, max: 0.5, color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" },
      { category: "Moderate", min: 0.5, max: 1.0, color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.1)" },
      { category: "Unhealthy", min: 1.0, max: 2.3, color: "#eab308", bgColor: "rgba(234, 179, 8, 0.1)" },
      { category: "Very Unhealthy", min: 2.3, max: 5.0, color: "#f97316", bgColor: "rgba(249, 115, 22, 0.1)" },
      { category: "Hazardous", min: 5.0, max: null, color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)" },
    ],
  },
  // Toluene — Alberta AAQC 24-hr = 400 ppb
  toluene: {
    baseUnit: "ppb",
    ranges: [
      { category: "Good", min: 0, max: 50, color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" },
      { category: "Moderate", min: 50, max: 200, color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.1)" },
      { category: "Unhealthy", min: 200, max: 400, color: "#eab308", bgColor: "rgba(234, 179, 8, 0.1)" },
      { category: "Very Unhealthy", min: 400, max: 1000, color: "#f97316", bgColor: "rgba(249, 115, 22, 0.1)" },
      { category: "Hazardous", min: 1000, max: null, color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)" },
    ],
  },
  // Ethylbenzene — Alberta AAQC 24-hr = 460 ppb
  ethylbenzene: {
    baseUnit: "ppb",
    ranges: [
      { category: "Good", min: 0, max: 50, color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" },
      { category: "Moderate", min: 50, max: 200, color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.1)" },
      { category: "Unhealthy", min: 200, max: 460, color: "#eab308", bgColor: "rgba(234, 179, 8, 0.1)" },
      { category: "Very Unhealthy", min: 460, max: 1000, color: "#f97316", bgColor: "rgba(249, 115, 22, 0.1)" },
      { category: "Hazardous", min: 1000, max: null, color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)" },
    ],
  },
  // Xylene — AAQC 24-hr = 700 ppb (total xylenes)
  xylenes: {
    baseUnit: "ppb",
    ranges: [
      { category: "Good", min: 0, max: 100, color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" },
      { category: "Moderate", min: 100, max: 350, color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.1)" },
      { category: "Unhealthy", min: 350, max: 700, color: "#eab308", bgColor: "rgba(234, 179, 8, 0.1)" },
      { category: "Very Unhealthy", min: 700, max: 1500, color: "#f97316", bgColor: "rgba(249, 115, 22, 0.1)" },
      { category: "Hazardous", min: 1500, max: null, color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)" },
    ],
  },
  // Solar Radiation - UV Index based ranges (W/m² approximations)
  solar: {
    baseUnit: "W/m²",
    ranges: [
      { category: "Low", min: 0, max: 200, color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" },
      { category: "Moderate", min: 200, max: 500, color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.1)" },
      { category: "High", min: 500, max: 800, color: "#eab308", bgColor: "rgba(234, 179, 8, 0.1)" },
      { category: "Very High", min: 800, max: null, color: "#f97316", bgColor: "rgba(249, 115, 22, 0.1)" },
    ],
  },
  // No ranges for meteorological parameters
  temp: null,
  temperature: null,
  humidity: null,
  windSpeed: null,
  windDir: null,
  windDirection: null,
};
