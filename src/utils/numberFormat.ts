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
  so2: 4, // ppb
  h2s: 4, // ppb
  no2: 4, // ppb
  benzene: 4, // ppb
  toluene: 4, // ppb
  ethylbenzene: 4, // ppb
  xylenes: 4, // ppb

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
