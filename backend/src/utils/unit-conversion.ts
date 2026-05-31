/**
 * Backend unit conversion for water quality parameters.
 *
 * Storage units (canonical):
 *   pH          → dimensionless
 *   DO, NH3-N, COD, BOD, TSS → mg/L
 *   Temperature → °C
 *   Pressure    → kPa
 *   Depth       → m
 *
 * Used by report exports so the file matches the user's chosen display unit.
 */

const BASE_UNITS: Record<string, string> = {
  ph:          "pH",
  do:          "mg/L",
  nh3n:        "mg/L",
  cod:         "mg/L",
  bod:         "mg/L",
  tss:         "mg/L",
  temperature: "°C",
  pressure:    "kPa",
  depth:       "m",
};

/**
 * Convert a stored value to the user's chosen display unit.
 * Returns the original value if no conversion applies.
 */
export const convertToDisplayUnit = (
  value: number,
  parameter: string,
  targetUnit: string,
): number => {
  const baseUnit = BASE_UNITS[parameter];
  if (!baseUnit || baseUnit === targetUnit) return value;

  if (parameter === "temperature") {
    if (baseUnit === "°C" && targetUnit === "°F") return value * 9 / 5 + 32;
  }

  if (parameter === "pressure") {
    if (baseUnit === "kPa" && targetUnit === "hPa") return value * 10;
    if (baseUnit === "kPa" && targetUnit === "psi") return value * 0.14504;
  }

  if (parameter === "depth") {
    if (baseUnit === "m" && targetUnit === "ft") return value * 3.28084;
  }

  return value;
};

export { BASE_UNITS };
