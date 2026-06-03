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
  // Water quality (Malaysia NWQS)
  wqi:         1, // Water Quality Index (dimensionless)
  ph:          2, // pH units
  do:          2, // mg/L
  nh3n:        3, // mg/L (small values need more precision)
  cod:         1, // mg/L
  bod:         1, // mg/L
  tss:         1, // mg/L
  temperature: 1, // °C
  depth:       2, // m
};

/**
 * Format a sensor value with parameter-specific decimal places
 * @param value - The numeric value to format
 * @param parameter - The parameter name (e.g., 'ph', 'do', 'temperature')
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
