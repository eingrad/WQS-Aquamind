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
  // NO2 - 1-hour average (Official Malaysian API, in ppb)
  no2: {
    unit: "ppb",
    ranges: [
      {
        category: "Good",
        range: "0 - 50",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        category: "Moderate",
        range: "51 - 100",
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.1)",
      },
      {
        category: "Unhealthy",
        range: "101 - 650",
        color: "#eab308",
        bgColor: "rgba(234, 179, 8, 0.1)",
      },
      {
        category: "Very Unhealthy",
        range: "651 - 1250",
        color: "#f97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
      },
      {
        category: "Hazardous",
        range: "> 1260",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
      },
    ],
  },
  // Benzene — Ontario AAQC 24-hr = 2.3 ppb
  benzene: {
    unit: "ppb",
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
        range: "1.1 - 2.3",
        color: "#eab308",
        bgColor: "rgba(234, 179, 8, 0.1)",
      },
      {
        category: "Very Unhealthy",
        range: "2.4 - 5.0",
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
  // Toluene — Alberta AAQC 24-hr = 400 ppb
  toluene: {
    unit: "ppb",
    ranges: [
      {
        category: "Good",
        range: "0 - 50",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        category: "Moderate",
        range: "51 - 200",
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.1)",
      },
      {
        category: "Unhealthy",
        range: "201 - 400",
        color: "#eab308",
        bgColor: "rgba(234, 179, 8, 0.1)",
      },
      {
        category: "Very Unhealthy",
        range: "401 - 1000",
        color: "#f97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
      },
      {
        category: "Hazardous",
        range: "> 1000",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
      },
    ],
  },
  // Ethylbenzene — Alberta AAQC 24-hr = 460 ppb
  ethylbenzene: {
    unit: "ppb",
    ranges: [
      {
        category: "Good",
        range: "0 - 50",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        category: "Moderate",
        range: "51 - 200",
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.1)",
      },
      {
        category: "Unhealthy",
        range: "201 - 460",
        color: "#eab308",
        bgColor: "rgba(234, 179, 8, 0.1)",
      },
      {
        category: "Very Unhealthy",
        range: "461 - 1000",
        color: "#f97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
      },
      {
        category: "Hazardous",
        range: "> 1000",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
      },
    ],
  },
  // m,p-Xylene — half-split of total xylene AAQC 24-hr (700 ppb / 2 = 350)
  mp_xylene: {
    unit: "ppb",
    ranges: [
      {
        category: "Good",
        range: "0 - 50",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        category: "Moderate",
        range: "51 - 175",
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.1)",
      },
      {
        category: "Unhealthy",
        range: "176 - 350",
        color: "#eab308",
        bgColor: "rgba(234, 179, 8, 0.1)",
      },
      {
        category: "Very Unhealthy",
        range: "351 - 750",
        color: "#f97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
      },
      {
        category: "Hazardous",
        range: "> 750",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
      },
    ],
  },
  // o-Xylene — same half-split as m,p
  o_xylene: {
    unit: "ppb",
    ranges: [
      {
        category: "Good",
        range: "0 - 50",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        category: "Moderate",
        range: "51 - 175",
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.1)",
      },
      {
        category: "Unhealthy",
        range: "176 - 350",
        color: "#eab308",
        bgColor: "rgba(234, 179, 8, 0.1)",
      },
      {
        category: "Very Unhealthy",
        range: "351 - 750",
        color: "#f97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
      },
      {
        category: "Hazardous",
        range: "> 750",
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
