/**
 * Instrument/Analyzer measurement capabilities
 * Values outside these ranges mean the sensor cannot accurately measure them
 * Flag: exceeding_range (Yellow)
 */
export const INSTRUMENT_RANGES = {
  so2: { min: 0, max: 20, unit: "ppm" },
  h2s: { min: 0, max: 2, unit: "ppm" },
  no2: { min: 0, max: 20, unit: "ppm" },
  btex: { min: 0.3, max: 20, unit: "ppb" },
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
  // Malaysia Ambient Air Quality Standard (1-hour average): 0.095 ppm (250 µg/m³)
  // Using conservative limit of 0.13 ppm from RMAQG for operational monitoring
  so2: { min: 0, max: 0.13, unit: "ppm" },

  // DOE industrial emission limit: ~5.38 ppm (7.5 mg/m³)
  // Using 0.05 ppm as ambient safety threshold (well below industrial limit)
  h2s: { min: 0, max: 0.05, unit: "ppm" },

  // Malaysia Ambient Air Quality Standard (1-hour average): 0.149 ppm (280 µg/m³)
  // Using conservative limit of 0.17 ppm from RMAQG for operational monitoring
  no2: { min: 0, max: 0.17, unit: "ppm" },

  // EU guideline: 5 µg/m³ annual average (benzene)
  // Using 10 ppb as conservative hourly threshold
  btex: { min: 0.3, max: 10, unit: "ppb" },

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
