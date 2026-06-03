/**
 * Unit Conversion Utility
 *
 * Backend base units (water quality parameters):
 *   pH          → dimensionless
 *   DO, NH3-N, COD, BOD, TSS → mg/L
 *   Temperature → °C
 *   Depth       → m
 */

// Supported unit options per parameter
export const UNIT_OPTIONS: Record<string, string[]> = {
  wqi:         [""],
  ph:          ["pH"],
  do:          ["mg/L"],
  nh3n:        ["mg/L"],
  cod:         ["mg/L"],
  bod:         ["mg/L"],
  tss:         ["mg/L"],
  temperature: ["°C", "°F"],
  depth:       ["m", "ft"],
};

// Default base units from backend
export const BASE_UNITS: Record<string, string> = {
  wqi:         "",
  ph:          "pH",
  do:          "mg/L",
  nh3n:        "mg/L",
  cod:         "mg/L",
  bod:         "mg/L",
  tss:         "mg/L",
  temperature: "°C",
  depth:       "m",
};

/**
 * Convert a value from the backend base unit to a target display unit.
 * Returns null if no conversion is needed or the parameter is unknown.
 */
export const convertUnit = (
  value: number,
  parameter: string,
  baseUnit: string,
  targetUnit: string,
): number | null => {
  if (baseUnit === targetUnit) return value;

  if (parameter === "temperature") {
    if (baseUnit === "°C" && targetUnit === "°F") return value * 9 / 5 + 32;
    if (baseUnit === "°F" && targetUnit === "°C") return (value - 32) * 5 / 9;
  }

  if (parameter === "depth") {
    if (baseUnit === "m" && targetUnit === "ft") return value * 3.28084;
    if (baseUnit === "ft" && targetUnit === "m") return value / 3.28084;
  }

  return null;
};
