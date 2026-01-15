import { INSTRUMENT_RANGES, OPERATIONAL_RANGES } from "./parameter-ranges";
import {
  checkParameterRelations,
  getAffectedParameters,
  TelemetryReadings,
} from "./parameter-relations";

/**
 * Validation flag types
 */
export type ValidationFlag =
  | "valid"
  | "exceeding_range"
  | "out_of_range"
  | "parameter_relation"
  | "maintenance"
  | "insufficient_data";

/**
 * Validation result for each parameter
 */
export interface ValidationResult {
  flags: Record<string, ValidationFlag>;
  hasIssues: boolean;
  relationViolations?: string[]; // Optional: descriptions of relation issues
}

/**
 * Validation modes:
 * - 'full': Check both instrument ranges and operational/regulatory limits (for 1-hour aggregates)
 * - 'instrument_only': Check only instrument sensor ranges (for 1-minute storage)
 */
export type ValidationMode = "full" | "instrument_only";

/**
 * Validate parameter values with three-layer checking:
 * Priority 1: EXCEEDING_RANGE (Yellow) - Value exceeds instrument measurement capability
 * Priority 2: OUT_OF_RANGE (Red) - Value violates operational/regulatory limits (only in 'full' mode)
 * Priority 3: PARAMETER_RELATION (Purple) - Cross-parameter inconsistencies
 * Priority 4: VALID (Green) - All checks passed
 *
 * @param readings - Object with parameter values
 * @param mode - Validation mode: 'full' (default) or 'instrument_only'
 */
export const validateParameterValues = (
  readings: any,
  mode: ValidationMode = "full"
): ValidationResult => {
  const flags: Record<string, ValidationFlag> = {};
  let hasIssues = false;
  const relationViolations: string[] = [];

  // Priority 1 & 2: Individual parameter range checks
  Object.entries(readings).forEach(([param, value]) => {
    if (value === null || value === undefined) return;

    const instrumentRange =
      INSTRUMENT_RANGES[param as keyof typeof INSTRUMENT_RANGES];
    const operationalRange =
      OPERATIONAL_RANGES[param as keyof typeof OPERATIONAL_RANGES];

    if (!instrumentRange || !operationalRange) return;

    const numValue = Number(value);
    if (isNaN(numValue)) {
      // Treat invalid numbers as exceeding range
      flags[param] = "exceeding_range";
      hasIssues = true;
      return;
    }

    // Priority 1: Check if value exceeds instrument capability (most severe - data unreliable)
    if (numValue < instrumentRange.min || numValue > instrumentRange.max) {
      flags[param] = "exceeding_range";
      hasIssues = true;
      return;
    }

    // Priority 2: Check if value violates operational limits (data reliable but unacceptable)
    // Skip this check if mode is 'instrument_only' (for 1-minute storage)
    if (mode === "full") {
      if (numValue < operationalRange.min || numValue > operationalRange.max) {
        flags[param] = "out_of_range";
        hasIssues = true;
        return;
      }
    }

    // All individual checks passed
    flags[param] = "valid";
  });

  // Priority 3: Check cross-parameter relationships
  // Only check if no exceeding_range or out_of_range flags (those take priority)
  // Also skip if mode is 'instrument_only'
  const hasCriticalIssues = Object.values(flags).some(
    (flag) => flag === "exceeding_range" || flag === "out_of_range"
  );

  if (!hasCriticalIssues && mode === "full") {
    const violations = checkParameterRelations(readings as TelemetryReadings);

    if (violations.length > 0) {
      const affectedParams = getAffectedParameters(violations);

      // Flag affected parameters
      affectedParams.forEach((param) => {
        // Only flag if it was previously marked as valid
        if (flags[param] === "valid") {
          flags[param] = "parameter_relation";
          hasIssues = true;
        }
      });

      // Store descriptions
      violations.forEach((v) => {
        relationViolations.push(v.description);
      });
    }
  }

  return {
    flags,
    hasIssues,
    relationViolations:
      relationViolations.length > 0 ? relationViolations : undefined,
  };
};
