/**
 * Water Quality Parameter Relation Validation
 * Detects suspicious cross-parameter readings that individually pass range checks
 * but together indicate sensor malfunction or real water quality issues.
 *
 * Based on:
 * - Malaysia NWQS Class II standards
 * - Aquatic chemistry principles (dissolved oxygen saturation, pH buffering)
 */

export interface TelemetryReadings {
  ph?: number;
  do?: number;         // Dissolved Oxygen (mg/L)
  nh3n?: number;       // Ammonia-Nitrogen (mg/L)
  cod?: number;        // Chemical Oxygen Demand (mg/L)
  bod?: number;        // Biochemical Oxygen Demand (mg/L)
  tss?: number;        // Total Suspended Solids (mg/L)
  temperature?: number; // Water Temperature (°C)
  pressure?: number;   // Pressure (kPa)
  depth?: number;      // Water Depth (m)
}

export interface RelationViolation {
  name: string;
  description: string;
  affectedParameters: string[];
  severity: "warning" | "critical";
}

/**
 * Check DO vs Temperature relationship
 * DO saturation decreases as water temperature rises.
 * Very high DO at very high temperature is physically impossible.
 */
const checkDO_TemperatureRelationship = (
  readings: TelemetryReadings
): RelationViolation | null => {
  const { do: doVal, temperature } = readings;
  if (doVal === undefined || temperature === undefined) return null;

  // At 35°C DO saturation is ~6.9 mg/L; values much above this suggest sensor error
  if (temperature > 33 && doVal > 9) {
    return {
      name: "DO-Temperature Saturation",
      description: `Unusually high DO (${doVal} mg/L) at elevated water temperature (${temperature}°C) — exceeds saturation limit`,
      affectedParameters: ["do", "temperature"],
      severity: "warning",
    };
  }

  // Very low temperature with very low DO is unusual for Malaysia rivers
  if (temperature < 22 && doVal < 3) {
    return {
      name: "DO-Temperature Anomaly",
      description: `Very low DO (${doVal} mg/L) at unexpectedly low temperature (${temperature}°C)`,
      affectedParameters: ["do", "temperature"],
      severity: "warning",
    };
  }

  return null;
};

/**
 * Check BOD vs DO relationship
 * High organic load (BOD) depletes dissolved oxygen through microbial respiration.
 * Very high BOD with very high DO is chemically inconsistent.
 */
const checkBOD_DORelationship = (
  readings: TelemetryReadings
): RelationViolation | null => {
  const { bod, do: doVal } = readings;
  if (bod === undefined || doVal === undefined) return null;

  // High BOD (>20 mg/L) should depress DO significantly; DO > 8 mg/L in that case is suspicious
  if (bod > 20 && doVal > 8) {
    return {
      name: "BOD-DO Inconsistency",
      description: `High organic load (BOD ${bod} mg/L) but unexpectedly high DO (${doVal} mg/L)`,
      affectedParameters: ["bod", "do"],
      severity: "warning",
    };
  }

  // Critically low DO (<1 mg/L) with low BOD (<2 mg/L) may indicate sensor fault
  if (doVal < 1 && bod < 2) {
    return {
      name: "DO-BOD Anomaly",
      description: `Near-zero DO (${doVal} mg/L) with low BOD (${bod} mg/L) — possible DO sensor fault`,
      affectedParameters: ["do", "bod"],
      severity: "warning",
    };
  }

  return null;
};

/**
 * Check pH vs Ammonia relationship
 * At high pH (>9), un-ionised (toxic) ammonia fraction increases dramatically.
 * High pH with high NH3-N is a critical water quality signal.
 */
const checkPH_AmmoniaRelationship = (
  readings: TelemetryReadings
): RelationViolation | null => {
  const { ph, nh3n } = readings;
  if (ph === undefined || nh3n === undefined) return null;

  if (ph > 9 && nh3n > 1.0) {
    return {
      name: "pH-Ammonia Toxicity",
      description: `High pH (${ph}) combined with elevated NH₃-N (${nh3n} mg/L) increases un-ionised ammonia toxicity`,
      affectedParameters: ["ph", "nh3n"],
      severity: "critical",
    };
  }

  // Very low pH with high ammonia is unusual (low pH suppresses free ammonia)
  if (ph < 5 && nh3n > 5) {
    return {
      name: "pH-Ammonia Anomaly",
      description: `Low pH (${ph}) with high NH₃-N (${nh3n} mg/L) — unusual combination, check sensors`,
      affectedParameters: ["ph", "nh3n"],
      severity: "warning",
    };
  }

  return null;
};

/**
 * Check COD vs BOD relationship
 * COD is always ≥ BOD because COD measures all oxidisable matter.
 * BOD > COD indicates a sensor or calculation error.
 */
const checkCOD_BODRelationship = (
  readings: TelemetryReadings
): RelationViolation | null => {
  const { cod, bod } = readings;
  if (cod === undefined || bod === undefined) return null;

  if (bod > cod) {
    return {
      name: "BOD > COD Violation",
      description: `BOD (${bod} mg/L) exceeds COD (${cod} mg/L) — physically impossible, check sensors`,
      affectedParameters: ["cod", "bod"],
      severity: "critical",
    };
  }

  return null;
};

/**
 * Check all parameter relationships
 */
export const checkParameterRelations = (
  readings: TelemetryReadings
): RelationViolation[] => {
  const violations: RelationViolation[] = [];

  const checks = [
    checkDO_TemperatureRelationship,
    checkBOD_DORelationship,
    checkPH_AmmoniaRelationship,
    checkCOD_BODRelationship,
  ];

  for (const check of checks) {
    const violation = check(readings);
    if (violation) violations.push(violation);
  }

  return violations;
};

/**
 * Get the set of affected parameters from a list of violations
 */
export const getAffectedParameters = (
  violations: RelationViolation[]
): Set<string> => {
  const affected = new Set<string>();
  violations.forEach((v) => v.affectedParameters.forEach((p) => affected.add(p)));
  return affected;
};
