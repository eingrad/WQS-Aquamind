/**
 * Parameter Relation Validation
 * Detects suspicious cross-parameter readings that individually pass range checks
 * but together indicate sensor malfunction or data quality issues.
 *
 * Based on:
 * - Petrochemical industry standards
 * - Physical laws (thermodynamics, meteorology)
 * - PETRONAS regulatory requirements
 */

export interface TelemetryReadings {
  so2?: number;
  h2s?: number;
  no2?: number;
  no?: number;
  nox?: number;
  // BTEX components — Synspec GC955 (ppb)
  benzene?: number;
  toluene?: number;
  ethylbenzene?: number;
  xylenes?: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  windDirection?: number;
  solar?: number;
  pressure?: number;
  rain?: number;
}

export interface RelationViolation {
  name: string;
  description: string;
  affectedParameters: string[];
  severity: "warning" | "critical";
}

/**
 * Check H2S-SO2 correlation
 * Both are sulfur-based pollutants from petroleum refining
 */
const checkH2S_SO2Correlation = (
  readings: TelemetryReadings
): RelationViolation | null => {
  const { h2s, so2 } = readings;

  if (h2s === undefined || so2 === undefined) return null;

  // High H2S (>0.03 ppm) should correlate with elevated SO2 (>0.02 ppm)
  if (h2s > 0.03 && so2 < 0.02) {
    return {
      name: "H2S-SO2 Correlation",
      description: `High H2S (${h2s} ppm) but unexpectedly low SO2 (${so2} ppm)`,
      affectedParameters: ["h2s", "so2"],
      severity: "warning",
    };
  }

  return null;
};

/**
 * Check temperature-humidity physics
 * Hot air holds more moisture, so high temp → lower relative humidity
 */
const checkTemperatureHumidityPhysics = (
  readings: TelemetryReadings
): RelationViolation | null => {
  const { temperature, humidity } = readings;

  if (temperature === undefined || humidity === undefined) return null;

  // Very high temperature with very high humidity is unusual for Malaysia
  if (temperature > 33 && humidity > 92) {
    return {
      name: "Temperature-Humidity Physics",
      description: `Unusually high temp (${temperature}°C) with very high humidity (${humidity}%)`,
      affectedParameters: ["temperature", "humidity"],
      severity: "warning",
    };
  }

  // Too cold and too dry for Malaysia's tropical climate
  if (temperature < 22 && humidity < 65) {
    return {
      name: "Temperature-Humidity Physics",
      description: `Unusually low temp (${temperature}°C) with low humidity (${humidity}%)`,
      affectedParameters: ["temperature", "humidity"],
      severity: "warning",
    };
  }

  return null;
};

/**
 * Check NO2-SO2 combustion relationship
 * Both produced during combustion/flaring events
 */
const checkNO2_SO2Combustion = (
  readings: TelemetryReadings
): RelationViolation | null => {
  const { no2, so2 } = readings;

  if (no2 === undefined || so2 === undefined) return null;

  // Elevated NO2 often accompanies SO2 during flaring
  if (no2 > 0.12 && so2 < 0.03) {
    return {
      name: "NO2-SO2 Combustion",
      description: `High NO2 (${no2} ppm) from combustion but unexpectedly low SO2 (${so2} ppm)`,
      affectedParameters: ["no2", "so2"],
      severity: "warning",
    };
  }

  return null;
};

/**
 * Check BTEX-wind relationship.
 * VOCs disperse with wind, accumulate in calm conditions. The Synspec GC955
 * reports BTEX as 5 separate isomer channels — for this rule we sum them to
 * get total BTEX and apply the same dispersal-violation threshold as before.
 */
const checkBTEX_WindRelationship = (
  readings: TelemetryReadings
): RelationViolation | null => {
  const {
    benzene,
    toluene,
    ethylbenzene,
    xylenes,
    windSpeed,
  } = readings;

  if (windSpeed === undefined) return null;

  // Need at least one BTEX component reading; otherwise skip the rule.
  const components = [benzene, toluene, ethylbenzene, xylenes];
  const present = components.filter((v) => v !== undefined) as number[];
  if (present.length === 0) return null;

  const totalBtex = present.reduce((a, b) => a + b, 0);

  // Very high BTEX total with very high wind is unusual (should disperse)
  if (totalBtex > 5 && windSpeed > 15) {
    return {
      name: "BTEX-Wind Relationship",
      description: `High total BTEX (${totalBtex.toFixed(2)} ppb) despite strong wind (${windSpeed} m/s) dispersal`,
      affectedParameters: [
        "benzene",
        "toluene",
        "ethylbenzene",
        "xylenes",
        "windSpeed",
      ],
      severity: "critical",
    };
  }

  return null;
};

/**
 * Check temperature-solar radiation relationship
 * High solar radiation → temperature increase
 */
const checkTemperatureSolarRelationship = (
  readings: TelemetryReadings
): RelationViolation | null => {
  const { temperature, solar } = readings;

  if (temperature === undefined || solar === undefined) return null;

  // Very high solar with low temperature is suspicious
  if (solar > 1000 && temperature < 25) {
    return {
      name: "Temperature-Solar Radiation",
      description: `Intense sun (${solar} W/m²) but cool temp (${temperature}°C)`,
      affectedParameters: ["temperature", "solar"],
      severity: "warning",
    };
  }

  return null;
};

/**
 * Check all parameter relationships
 * Returns list of violations detected
 */
export const checkParameterRelations = (
  readings: TelemetryReadings
): RelationViolation[] => {
  const violations: RelationViolation[] = [];

  const checks = [
    checkH2S_SO2Correlation,
    checkTemperatureHumidityPhysics,
    checkNO2_SO2Combustion,
    checkBTEX_WindRelationship,
    checkTemperatureSolarRelationship,
  ];

  for (const check of checks) {
    const violation = check(readings);
    if (violation) {
      violations.push(violation);
    }
  }

  return violations;
};

/**
 * Get affected parameters from violations
 */
export const getAffectedParameters = (
  violations: RelationViolation[]
): Set<string> => {
  const affected = new Set<string>();

  violations.forEach((v) => {
    v.affectedParameters.forEach((param) => affected.add(param));
  });

  return affected;
};
