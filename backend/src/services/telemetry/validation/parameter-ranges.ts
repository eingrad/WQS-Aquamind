/**
 * Instrument/Analyzer measurement capabilities
 * Values outside these ranges mean the sensor cannot accurately measure them
 * Flag: exceeding_range (Yellow)
 */
export const INSTRUMENT_RANGES = {
  // Serinus 51 (combined H2S/SO2 UV fluorescence): 0-2 ppm = 0-2000 ppb
  so2: { min: 0, max: 2000, unit: "ppb" },
  h2s: { min: 0, max: 2000, unit: "ppb" },
  // NOx analyzer: 0-20 ppm autoranging = 0-20000 ppb per channel
  no2: { min: 0, max: 20000, unit: "ppb" },
  no: { min: 0, max: 20000, unit: "ppb" },
  nox: { min: 0, max: 40000, unit: "ppb" },
  // Synspec GC955 BTEX (PID): 0-20 ppb standard, up to 300 ppb extended config.
  // Each compound shares the same instrument range (single PID detector).
  benzene: { min: 0, max: 300, unit: "ppb" },
  toluene: { min: 0, max: 300, unit: "ppb" },
  ethylbenzene: { min: 0, max: 300, unit: "ppb" },
  mp_xylene: { min: 0, max: 300, unit: "ppb" },
  o_xylene: { min: 0, max: 300, unit: "ppb" },
  temperature: { min: -40, max: 85, unit: "°C" },
  humidity: { min: 0, max: 100, unit: "%" },
  windSpeed: { min: 0, max: 60, unit: "m/s" },
  windDirection: { min: 0, max: 360, unit: "°" },
  solar: { min: 0, max: 2000, unit: "W/m²" },
  pressure: { min: 300, max: 1200, unit: "hPa" },
  rain: { min: 0, max: 200, unit: "mm/h" },
};

/**
 * Operational/Regulatory acceptable ranges based on Malaysia standards
 *
 * IMPORTANT: These ranges are for 1-HOUR AVERAGE validation only!
 * - Applied when aggregating 1-minute data to 1-hour averages
 * - Used for regulatory compliance reporting (Malaysia DOE standards)
 * - NOT applied to individual 1-minute readings
 *
 * Values outside these ranges indicate regulatory violations or physically impossible readings
 * Flag: out_of_range (Red)
 *
 * References:
 * - New Malaysia Ambient Air Quality Standard (2020)
 * - Environmental Quality (Clean Air) Regulations 2014
 * - Malaysia Meteorological Department climate data
 */
export const OPERATIONAL_RANGES = {
  // Malaysia Ambient Air Quality Standard (1-hour average): 95 ppb (250 µg/m³)
  // Using conservative limit of 130 ppb from RMAQG for operational monitoring
  so2: { min: 0, max: 130, unit: "ppb" },

  // DOE industrial emission limit: ~5380 ppb (7.5 mg/m³)
  // Using 50 ppb as ambient safety threshold (well below industrial limit)
  h2s: { min: 0, max: 50, unit: "ppb" },

  // Malaysia Ambient Air Quality Standard (1-hour average): 149 ppb (280 µg/m³)
  // Using conservative limit of 170 ppb from RMAQG for operational monitoring
  no2: { min: 0, max: 170, unit: "ppb" },

  // NO: No specific Malaysian ambient standard — using WHO guideline
  // Conservative limit aligned with NO2 for operational monitoring
  no: { min: 0, max: 170, unit: "ppb" },

  // NOx (NO + NO2): Combined nitrogen oxides
  // Using sum of individual limits as conservative threshold
  nox: { min: 0, max: 320, unit: "ppb" },

  // BTEX components — Canadian provincial AAQC 24-hr limits (ppb).
  // Lower bound 0.1 ppb is the GC955 detection limit; values below are flagged
  // as below-LOD (treated as out_of_range against the operational floor).
  // Total Xylene AAQC 24-hr = 700 ppb; the per-isomer threshold is split half
  // each so the per-column validator approximates the total-xylene limit.
  benzene: { min: 0.1, max: 2.3, unit: "ppb" }, // Ontario AAQC 24-hr
  toluene: { min: 0.1, max: 400, unit: "ppb" }, // Alberta AAQC 24-hr
  ethylbenzene: { min: 0.1, max: 460, unit: "ppb" }, // Alberta AAQC 24-hr
  mp_xylene: { min: 0.1, max: 350, unit: "ppb" },
  o_xylene: { min: 0.1, max: 350, unit: "ppb" },

  // Malaysia tropical climate: 21-32°C typical range
  // Allow 20-35°C for operational monitoring (accounts for daily variation)
  temperature: { min: 20, max: 35, unit: "°C" },

  // Malaysia average humidity: 80-90% typical
  // Allow 60-100% (tropical climate rarely drops below 60%)
  humidity: { min: 60, max: 100, unit: "%" },

  // Tropical storm threshold: ~33 m/s (120 km/h)
  // Using 30 m/s as extreme weather threshold
  windSpeed: { min: 0, max: 30, unit: "m/s" },

  // Full compass range - no restrictions
  windDirection: { min: 0, max: 360, unit: "°" },

  // Malaysia equatorial region: typical max ~1200 W/m²
  // Allow up to 1400 W/m² for clear day conditions
  solar: { min: 0, max: 1400, unit: "W/m²" },

  // Sea level atmospheric pressure: 1013 hPa ± 50 hPa normal variation
  // Using 980-1040 hPa range for Malaysia (tropical, sea-level conditions)
  pressure: { min: 980, max: 1040, unit: "hPa" },

  // Extreme tropical rainfall: ~100 mm/h during intense storms
  // Using 120 mm/h as extreme threshold
  rain: { min: 0, max: 120, unit: "mm/h" },
};

// Backward compatibility - keep PARAMETER_RANGES as alias to INSTRUMENT_RANGES
export const PARAMETER_RANGES = INSTRUMENT_RANGES;
