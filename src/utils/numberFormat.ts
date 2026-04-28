/**
 * Number Formatting Utilities
 * Consistent decimal formatting for sensor values across the application
 */

/**
 * Format a sensor value with specified decimal places
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string or '–' for null/undefined values
 */
export const formatSensorValue = (
  value: number | null | undefined,
  decimals: number = 2,
): string => {
  if (value === null || value === undefined) {
    return "–";
  }
  return Number(value).toFixed(decimals);
};

/**
 * Decimal places configuration for each parameter type
 */
const PARAMETER_DECIMALS: Record<string, number> = {
  // Pollutants (concentrations) — all gases stored in ppb
  so2: 2, // ppb
  h2s: 2, // ppb
  no2: 2, // ppb
  no: 2, // ppb
  nox: 2, // ppb
  benzene: 2, // ppb
  toluene: 2, // ppb
  ethylbenzene: 2, // ppb
  mp_xylene: 2, // ppb
  o_xylene: 2, // ppb

  // Meteorological
  solar: 2, // W/m²
  temperature: 2, // °C
  humidity: 2, // %
  pressure: 2, // hPa
  rain: 2, // mm

  // Wind
  windSpeed: 2, // m/s
  windDirection: 0, // degrees (no decimals for direction)
  windDir: 0, // legacy alias
};

/**
 * Format a pollutant/parameter value with parameter-specific decimal places
 * @param value - The numeric value to format
 * @param parameter - The parameter name (e.g., 'so2', 'temperature')
 * @returns Formatted string with appropriate decimal places
 */
export const formatPollutantValue = (
  value: number | null | undefined,
  parameter: string,
): string => {
  const decimals = PARAMETER_DECIMALS[parameter] ?? 2;
  return formatSensorValue(value, decimals);
};

/**
 * Format geographic coordinates
 * @param value - Coordinate value (latitude or longitude)
 * @param decimals - Decimal places (default: 4 for precision)
 * @returns Formatted coordinate string
 */
export const formatCoordinate = (
  value: number,
  decimals: number = 4,
): string => {
  return value.toFixed(decimals);
};
