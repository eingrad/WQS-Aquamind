/**
 * Unit Conversion Utility
 *
 * Backend base units:
 *   SO₂: ppm, H₂S: ppm, NO₂: ppm, BTEX: ppb
 *   Temperature: °C, Humidity: %, Wind Speed: m/s, Wind Direction: °
 *   Solar Radiation: W/m², Pressure: hPa, Rain: mm/h
 *
 * Molecular weights (for µg/m³ conversion at 25°C, 1 atm):
 *   SO₂ = 64.07 g/mol
 *   H₂S = 34.08 g/mol
 *   NO₂ = 46.01 g/mol
 *   BTEX ≈ 78.11 g/mol (using benzene as reference)
 *
 * Conversion factor: µg/m³ = ppm × (MW × 1000) / 24.45
 *   where 24.45 is molar volume at 25°C, 1 atm
 */

// Supported unit options per parameter
export const UNIT_OPTIONS: Record<string, string[]> = {
  so2: ["ppm", "ppb", "µg/m³"],
  h2s: ["ppm", "ppb", "µg/m³"],
  no2: ["ppm", "ppb", "µg/m³"],
  btex: ["ppb", "ppm", "µg/m³"],
  temperature: ["°C", "°F"],
  humidity: ["%", "g/m³"],
  windSpeed: ["m/s", "km/h", "mph"],
  windDirection: ["°", "Cardinal"],
  solar: ["W/m²", "kWh/m²"],
  pressure: ["hPa", "mmHg", "atm", "psi"],
  rain: ["mm/h", "in/h"],
};

// Default base units from backend
export const BASE_UNITS: Record<string, string> = {
  so2: "ppm",
  h2s: "ppm",
  no2: "ppm",
  btex: "ppb",
  temperature: "°C",
  humidity: "%",
  windSpeed: "m/s",
  windDirection: "°",
  solar: "W/m²",
  pressure: "hPa",
  rain: "mm/h",
};

// Default user-facing units (same as backend defaults)
export const DEFAULT_UNITS: Record<string, string> = { ...BASE_UNITS };

// Molecular weights for gas parameters
const MOLECULAR_WEIGHTS: Record<string, number> = {
  so2: 64.07,
  h2s: 34.08,
  no2: 46.01,
  btex: 78.11, // benzene reference
};

// Molar volume at 25°C, 1 atm (L/mol)
const MOLAR_VOLUME = 24.45;

/**
 * Convert a value from the backend base unit to the target unit
 */
export function convertValue(
  value: number | null | undefined,
  parameter: string,
  targetUnit: string,
): number | null {
  if (value === null || value === undefined || isNaN(value)) return null;

  const baseUnit = BASE_UNITS[parameter];
  if (!baseUnit || baseUnit === targetUnit) return value;

  // Gas parameters: ppm <-> ppb <-> µg/m³
  if (["so2", "h2s", "no2", "btex"].includes(parameter)) {
    return convertGas(value, parameter, baseUnit, targetUnit);
  }

  // Temperature: °C <-> °F
  if (parameter === "temperature") {
    return convertTemperature(value, baseUnit, targetUnit);
  }

  // Wind Speed: m/s <-> km/h <-> mph
  if (parameter === "windSpeed") {
    return convertWindSpeed(value, baseUnit, targetUnit);
  }

  // Solar Radiation: W/m² <-> kWh/m²
  if (parameter === "solar") {
    return convertSolar(value, baseUnit, targetUnit);
  }

  // Pressure: hPa <-> mmHg <-> atm <-> psi
  if (parameter === "pressure") {
    return convertPressure(value, baseUnit, targetUnit);
  }

  // Humidity: % <-> g/m³ (approximate at 25°C)
  if (parameter === "humidity") {
    return convertHumidity(value, baseUnit, targetUnit);
  }

  // Rain: mm/h <-> in/h
  if (parameter === "rain") {
    return convertRain(value, baseUnit, targetUnit);
  }

  // Wind Direction: ° <-> Cardinal (handled as string, return number for °)
  if (parameter === "windDirection") {
    // Cardinal is handled at display level, not numeric conversion
    return value;
  }

  return value;
}

/**
 * Convert gas concentration values
 * Base units: SO₂/H₂S/NO₂ = ppm, BTEX = ppb
 */
function convertGas(
  value: number,
  parameter: string,
  fromUnit: string,
  toUnit: string,
): number {
  const mw = MOLECULAR_WEIGHTS[parameter];
  if (!mw) return value;

  // First convert to ppm as intermediate
  let ppmValue: number;

  switch (fromUnit) {
    case "ppm":
      ppmValue = value;
      break;
    case "ppb":
      ppmValue = value / 1000;
      break;
    case "µg/m³":
      ppmValue = (value * MOLAR_VOLUME) / (mw * 1000);
      break;
    default:
      return value;
  }

  // Then convert from ppm to target
  switch (toUnit) {
    case "ppm":
      return ppmValue;
    case "ppb":
      return ppmValue * 1000;
    case "µg/m³":
      return (ppmValue * mw * 1000) / MOLAR_VOLUME;
    default:
      return value;
  }
}

/**
 * Convert temperature
 * Base unit: °C
 */
function convertTemperature(
  value: number,
  fromUnit: string,
  toUnit: string,
): number {
  // Convert to °C first
  let celsius: number;
  switch (fromUnit) {
    case "°C":
      celsius = value;
      break;
    case "°F":
      celsius = (value - 32) * (5 / 9);
      break;
    default:
      return value;
  }

  // Convert from °C to target
  switch (toUnit) {
    case "°C":
      return celsius;
    case "°F":
      return celsius * (9 / 5) + 32;
    default:
      return value;
  }
}

/**
 * Convert wind speed
 * Base unit: m/s
 */
function convertWindSpeed(
  value: number,
  fromUnit: string,
  toUnit: string,
): number {
  // Convert to m/s first
  let ms: number;
  switch (fromUnit) {
    case "m/s":
      ms = value;
      break;
    case "km/h":
      ms = value / 3.6;
      break;
    case "mph":
      ms = value / 2.237;
      break;
    default:
      return value;
  }

  // Convert from m/s to target
  switch (toUnit) {
    case "m/s":
      return ms;
    case "km/h":
      return ms * 3.6;
    case "mph":
      return ms * 2.237;
    default:
      return value;
  }
}

/**
 * Convert solar radiation
 * Base unit: W/m²
 */
function convertSolar(value: number, fromUnit: string, toUnit: string): number {
  // Convert to W/m² first
  let wm2: number;
  switch (fromUnit) {
    case "W/m²":
      wm2 = value;
      break;
    case "kWh/m²":
      wm2 = value * 1000;
      break;
    default:
      return value;
  }

  // Convert from W/m² to target
  switch (toUnit) {
    case "W/m²":
      return wm2;
    case "kWh/m²":
      return wm2 / 1000;
    default:
      return value;
  }
}

/**
 * Convert pressure
 * Base unit: hPa
 */
function convertPressure(
  value: number,
  fromUnit: string,
  toUnit: string,
): number {
  // Convert to hPa first
  let hpa: number;
  switch (fromUnit) {
    case "hPa":
      hpa = value;
      break;
    case "mmHg":
      hpa = value * 1.33322;
      break;
    case "atm":
      hpa = value * 1013.25;
      break;
    case "psi":
      hpa = value * 68.9476;
      break;
    default:
      return value;
  }

  // Convert from hPa to target
  switch (toUnit) {
    case "hPa":
      return hpa;
    case "mmHg":
      return hpa / 1.33322;
    case "atm":
      return hpa / 1013.25;
    case "psi":
      return hpa / 68.9476;
    default:
      return value;
  }
}

/**
 * Convert humidity
 * Base unit: % (relative humidity)
 * Approximate absolute humidity at 25°C: g/m³ ≈ RH% × 0.2302
 * (saturation vapor density at 25°C ≈ 23.02 g/m³)
 */
function convertHumidity(
  value: number,
  fromUnit: string,
  toUnit: string,
): number {
  const SATURATION_DENSITY_25C = 23.02; // g/m³ at 25°C

  // Convert to % first
  let rh: number;
  switch (fromUnit) {
    case "%":
      rh = value;
      break;
    case "g/m³":
      rh = (value / SATURATION_DENSITY_25C) * 100;
      break;
    default:
      return value;
  }

  // Convert from % to target
  switch (toUnit) {
    case "%":
      return rh;
    case "g/m³":
      return (rh / 100) * SATURATION_DENSITY_25C;
    default:
      return value;
  }
}

/**
 * Convert rainfall rate
 * Base unit: mm/h
 */
function convertRain(value: number, fromUnit: string, toUnit: string): number {
  // Convert to mm/h first
  let mmh: number;
  switch (fromUnit) {
    case "mm/h":
      mmh = value;
      break;
    case "in/h":
      mmh = value * 25.4;
      break;
    default:
      return value;
  }

  // Convert from mm/h to target
  switch (toUnit) {
    case "mm/h":
      return mmh;
    case "in/h":
      return mmh / 25.4;
    default:
      return value;
  }
}

/**
 * Convert wind direction degrees to cardinal direction string
 */
export function degreesToCardinal(degrees: number): string {
  const directions = [
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
  const index = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16;
  return directions[index];
}

/**
 * Get the display unit for a parameter based on user preferences
 */
export function getDisplayUnit(
  parameter: string,
  userUnits: Record<string, string>,
): string {
  return userUnits[parameter] || BASE_UNITS[parameter] || "";
}
