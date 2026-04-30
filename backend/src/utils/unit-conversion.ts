/**
 * Backend unit conversion — mirror of src/utils/unitConversion.ts.
 *
 * Storage units (canonical) are always:
 *   gases (so2, h2s, no2, benzene, toluene, ethylbenzene, xylenes) → ppb
 *   temperature → °C, humidity → %, windSpeed → m/s, windDirection → °
 *   solar → W/m², pressure → hPa, rain → mm (total per bucket)
 *
 * This module converts a stored value to the user's chosen display unit
 * for use in exports (CSV/TXT/PDF) so the report matches the dashboard.
 */

const MOLECULAR_WEIGHTS: Record<string, number> = {
  so2: 64.07,
  h2s: 34.08,
  no2: 46.01,
  benzene: 78.11,
  toluene: 92.14,
  ethylbenzene: 106.17,
  xylenes: 106.17,
};

const MOLAR_VOLUME = 24.45; // L/mol at 25°C, 1 atm

const BASE_UNITS: Record<string, string> = {
  so2: "ppb",
  h2s: "ppb",
  no2: "ppb",
  benzene: "ppb",
  toluene: "ppb",
  ethylbenzene: "ppb",
  xylenes: "ppb",
  temperature: "°C",
  humidity: "%",
  windSpeed: "m/s",
  windDirection: "°",
  solar: "W/m²",
  pressure: "hPa",
  rain: "mm",
};

const GAS_PARAMS = new Set([
  "so2",
  "h2s",
  "no2",
  "benzene",
  "toluene",
  "ethylbenzene",
  "xylenes",
]);

const convertGas = (value: number, parameter: string, toUnit: string): number => {
  const mw = MOLECULAR_WEIGHTS[parameter];
  if (!mw) return value;
  // Storage is always ppb → ppm intermediate
  const ppm = value / 1000;
  switch (toUnit) {
    case "ppb":
      return value;
    case "ppm":
      return ppm;
    case "µg/m³":
      return (ppm * mw * 1000) / MOLAR_VOLUME;
    default:
      return value;
  }
};

const convertTemperature = (value: number, toUnit: string): number => {
  // Storage is °C
  switch (toUnit) {
    case "°C":
      return value;
    case "°F":
      return value * (9 / 5) + 32;
    default:
      return value;
  }
};

const convertWindSpeed = (value: number, toUnit: string): number => {
  switch (toUnit) {
    case "m/s":
      return value;
    case "km/h":
      return value * 3.6;
    case "mph":
      return value * 2.237;
    default:
      return value;
  }
};

const convertSolar = (value: number, toUnit: string): number => {
  switch (toUnit) {
    case "W/m²":
      return value;
    case "kWh/m²":
      return value / 1000;
    default:
      return value;
  }
};

const convertPressure = (value: number, toUnit: string): number => {
  switch (toUnit) {
    case "hPa":
      return value;
    case "mmHg":
      return value / 1.33322;
    case "atm":
      return value / 1013.25;
    case "psi":
      return value / 68.9476;
    default:
      return value;
  }
};

const convertHumidity = (value: number, toUnit: string): number => {
  // Storage is % RH; "g/m³" approximates absolute humidity at 25°C
  const SATURATION_DENSITY_25C = 23.02;
  switch (toUnit) {
    case "%":
      return value;
    case "g/m³":
      return (value / 100) * SATURATION_DENSITY_25C;
    default:
      return value;
  }
};

const convertRain = (value: number, toUnit: string): number => {
  switch (toUnit) {
    case "mm":
      return value;
    case "in":
      return value / 25.4;
    default:
      return value;
  }
};

/**
 * Convert a stored numeric value to the requested target unit.
 * Returns the original value if the parameter has no conversion or the
 * target unit equals the storage unit.
 */
export const convertValue = (
  value: number | null | undefined,
  parameter: string,
  targetUnit: string | undefined,
): number | null => {
  if (value === null || value === undefined) return value ?? null;
  if (!targetUnit) return value;
  const baseUnit = BASE_UNITS[parameter];
  if (!baseUnit || baseUnit === targetUnit) return value;

  if (GAS_PARAMS.has(parameter)) return convertGas(value, parameter, targetUnit);
  if (parameter === "temperature") return convertTemperature(value, targetUnit);
  if (parameter === "windSpeed") return convertWindSpeed(value, targetUnit);
  if (parameter === "solar") return convertSolar(value, targetUnit);
  if (parameter === "pressure") return convertPressure(value, targetUnit);
  if (parameter === "humidity") return convertHumidity(value, targetUnit);
  if (parameter === "rain") return convertRain(value, targetUnit);
  // windDirection: numeric ° always; cardinal is a display-only concern
  return value;
};

/**
 * Resolve the unit label for a parameter given user preferences.
 * Falls back to the storage unit if no preference is provided.
 */
export const resolveUnit = (
  parameter: string,
  units: Record<string, string> | undefined,
): string => {
  return units?.[parameter] || BASE_UNITS[parameter] || "";
};
