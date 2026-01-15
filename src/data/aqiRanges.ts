/**
 * AQI (Air Quality Index) Ranges and Types
 * Based on Malaysian API (Air Pollutant Index) standards from Department of Environment
 */

export type AQIRange = {
  category: string;
  range: string;
  color: string;
  bgColor: string;
};

export type ExposureRangeData = {
  unit: string;
  ranges: AQIRange[];
};

/**
 * Official Malaysian API breakpoints and exposure limits for various pollutants
 *
 * Formula: API = [(IHi - ILo) / (BPHi - BPLo)] × (C - BPLo) + ILo
 *
 * Categories:
 * - Good (0-50)
 * - Moderate (51-100)
 * - Unhealthy (101-200)
 * - Very Unhealthy (201-300)
 * - Hazardous (301-500)
 */
export const EXPOSURE_RANGES: Record<string, ExposureRangeData | null> = {
  // SO2 - 24-hour average (Official Malaysian API - Department of Environment)
  so2: {
    unit: "µg/m³",
    ranges: [
      {
        category: "Good",
        range: "0 - 94.31",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        category: "Moderate",
        range: "94.32 - 199.13",
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.1)",
      },
      {
        category: "Unhealthy",
        range: "199.14 - 799.07",
        color: "#eab308",
        bgColor: "rgba(234, 179, 8, 0.1)",
      },
      {
        category: "Very Unhealthy",
        range: "799.08 - 1248.12",
        color: "#f97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
      },
      {
        category: "Hazardous",
        range: "> 1248.12",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
      },
    ],
  },
  // H2S - Occupational exposure limits (Not part of Malaysian API, using ACGIH TLV)
  h2s: {
    unit: "ppb",
    ranges: [
      {
        category: "Good",
        range: "0 - 3",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        category: "Moderate",
        range: "3 - 30",
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.1)",
      },
      {
        category: "Unhealthy",
        range: "31 - 1000",
        color: "#eab308",
        bgColor: "rgba(234, 179, 8, 0.1)",
      },
      {
        category: "Very Unhealthy",
        range: "1001 - 10000",
        color: "#f97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
      },
      {
        category: "Hazardous",
        range: "> 10001",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
      },
    ],
  },
  // NO2 - 1-hour average (Official Malaysian API, converted to ppm: 1 ppm = 1880 µg/m³)
  no2: {
    unit: "ppm",
    ranges: [
      {
        category: "Good",
        range: "0 - 0.05",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        category: "Moderate",
        range: "0.06 - 0.1",
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.1)",
      },
      {
        category: "Unhealthy",
        range: "0.11 - 0.65",
        color: "#eab308",
        bgColor: "rgba(234, 179, 8, 0.1)",
      },
      {
        category: "Very Unhealthy",
        range: "0.66 - 1.25",
        color: "#f97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
      },
      {
        category: "Hazardous",
        range: "> 1.26",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
      },
    ],
  },
  // BTEX - Environmental limits (Not part of Malaysian API, using EPA guidelines)
  btx: {
    unit: "ppm",
    ranges: [
      {
        category: "Good",
        range: "0 - 0.5",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        category: "Moderate",
        range: "0.6 - 1.0",
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.1)",
      },
      {
        category: "Unhealthy",
        range: "1.1 - 2.0",
        color: "#eab308",
        bgColor: "rgba(234, 179, 8, 0.1)",
      },
      {
        category: "Very Unhealthy",
        range: "2.1 - 5.0",
        color: "#f97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
      },
      {
        category: "Hazardous",
        range: "> 5.0",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
      },
    ],
  },
  // Solar Radiation - UV Index based ranges (W/m² approximations)
  solar: {
    unit: "W/m²",
    ranges: [
      {
        category: "Low",
        range: "0 - 200",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        category: "Moderate",
        range: "201 - 500",
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.1)",
      },
      {
        category: "High",
        range: "501 - 800",
        color: "#eab308",
        bgColor: "rgba(234, 179, 8, 0.1)",
      },
      {
        category: "Very High",
        range: "> 800",
        color: "#f97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
      },
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
