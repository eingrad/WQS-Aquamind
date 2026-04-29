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
  xylenes: { min: 0, max: 300, unit: "ppb" },
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
 * Two tables: 1-hour and 24-hour averaging periods, per contract.
 * Only parameters explicitly specified in the contract are validated.
 *
 * Values outside these ranges indicate regulatory violations.
 * Flag: out_of_range (Red)
 *
 * References:
 * - New Malaysia Ambient Air Quality Standard (2020)
 * - Environmental Quality (Clean Air) Regulations 2014
 * - Malaysia Meteorological Department climate data
 */

/**
 * 1-HOUR AVERAGE limits — only contract-specified gases plus environmentals.
 * NO, NOx, H2S, BTEX have no 1-hour standard in contract → not validated here.
 */
export const OPERATIONAL_RANGES_1H = {
  // Malaysia Ambient Air Quality Standard (1-hour): 95 ppb (250 µg/m³)
  so2: { min: 0, max: 95, unit: "ppb" },

  // Malaysia Ambient Air Quality Standard (1-hour): 149 ppb (280 µg/m³)
  no2: { min: 0, max: 149, unit: "ppb" },

  // Malaysia tropical climate: 21-32°C typical range
  temperature: { min: 20, max: 35, unit: "°C" },

  // Malaysia average humidity: 80-90% typical
  humidity: { min: 60, max: 100, unit: "%" },

  // Tropical storm threshold: ~33 m/s (120 km/h)
  windSpeed: { min: 0, max: 30, unit: "m/s" },

  // Full compass range - no restrictions
  windDirection: { min: 0, max: 360, unit: "°" },

  // Malaysia equatorial region: typical max ~1200 W/m²
  solar: { min: 0, max: 1400, unit: "W/m²" },

  // Sea level pressure: 1013 hPa ± 50 hPa normal variation
  pressure: { min: 980, max: 1040, unit: "hPa" },

  // Extreme tropical rainfall: ~100 mm/h during intense storms
  rain: { min: 0, max: 120, unit: "mm/h" },
};

/**
 * 24-HOUR AVERAGE limits — contract-specified gases and BTEX.
 * Xylene uses combined total xylene limit (700 µg/m³ ≈ 161 ppb).
 * NO, NOx have no 24-hour standard in contract → not validated.
 */
export const OPERATIONAL_RANGES_24H = {
  // Malaysia AAQS (24-hour): 30 ppb (80 µg/m³)
  so2: { min: 0, max: 30, unit: "ppb" },

  // Malaysia AAQS (24-hour): 37 ppb (70 µg/m³)
  no2: { min: 0, max: 37, unit: "ppb" },

  // Contract 24-hour: 5 ppb (7 µg/m³)
  h2s: { min: 0, max: 5, unit: "ppb" },

  // BTEX 24-hour limits per contract.
  // Lower bound is the GC955 detection limit (LOD); values below are flagged
  // as below-LOD (treated as out_of_range against the operational floor).
  benzene: { min: 0.03, max: 0.72, unit: "ppb" },      // 2.3 µg/m³
  toluene: { min: 0.03, max: 106, unit: "ppb" },       // 400 µg/m³
  ethylbenzene: { min: 0.02, max: 106, unit: "ppb" },  // 460 µg/m³
  xylenes: { min: 0.02, max: 161, unit: "ppb" },       // 700 µg/m³ total xylene
};

// Default export retained as 1H map for any legacy import paths.
export const OPERATIONAL_RANGES = OPERATIONAL_RANGES_1H;

// Backward compatibility - keep PARAMETER_RANGES as alias to INSTRUMENT_RANGES
export const PARAMETER_RANGES = INSTRUMENT_RANGES;
