/**
 * Instrument/Sensor measurement capability ranges
 * Values outside these ranges mean the sensor cannot accurately measure them.
 * Flag: exceeding_range (Yellow)
 */
export const INSTRUMENT_RANGES = {
  // pH electrode: full range 0–14, practical sensor range 2–12 for most probes
  ph: { min: 0, max: 14, unit: "pH" },
  // Dissolved Oxygen (optical or membrane sensor): 0–20 mg/L typical
  do: { min: 0, max: 20, unit: "mg/L" },
  // Ammonia-Nitrogen (ISE or colorimetric): 0–100 mg/L
  nh3n: { min: 0, max: 100, unit: "mg/L" },
  // COD (UV absorption or reactor digestion): 0–1000 mg/L
  cod: { min: 0, max: 1000, unit: "mg/L" },
  // BOD (5-day test or online sensor): 0–500 mg/L
  bod: { min: 0, max: 500, unit: "mg/L" },
  // TSS (turbidimeter/optical): 0–2000 mg/L
  tss: { min: 0, max: 2000, unit: "mg/L" },
  // Water temperature: Malaysia rivers 20–35°C; sensor range wider
  temperature: { min: 0, max: 50, unit: "°C" },
  // Atmospheric/water pressure: sensor range 80–120 kPa
  pressure: { min: 80, max: 120, unit: "kPa" },
  // Water depth: 0–50 m (standard submersible pressure transducer)
  depth: { min: 0, max: 50, unit: "m" },
};

/**
 * Operational/Regulatory acceptable ranges based on
 * Malaysia National Water Quality Standards (NWQS) — Class II (River Water)
 *
 * References:
 * - Environmental Quality Act 1974 (Water Quality)
 * - Malaysia DOE National Water Quality Standards for Malaysia
 *
 * Class II limits are used as the primary operational threshold.
 * Values outside these ranges indicate a regulatory violation.
 * Flag: out_of_range (Red)
 */

/**
 * Short-term (1-hour) operational limits — Class II NWQS
 */
export const OPERATIONAL_RANGES_1H = {
  // pH: Class II 6.0–9.0
  ph: { min: 6.0, max: 9.0, unit: "pH" },
  // Dissolved Oxygen: Class II minimum 5 mg/L; no upper physical limit
  do: { min: 5.0, max: 20, unit: "mg/L" },
  // Ammonia-N: Class II maximum 0.3 mg/L
  nh3n: { min: 0, max: 0.3, unit: "mg/L" },
  // COD: Class II maximum 25 mg/L
  cod: { min: 0, max: 25, unit: "mg/L" },
  // BOD: Class II maximum 3 mg/L
  bod: { min: 0, max: 3, unit: "mg/L" },
  // TSS: Class II maximum 50 mg/L
  tss: { min: 0, max: 50, unit: "mg/L" },
  // Water temperature: Malaysia rivers 20–32°C typical; >40°C is critical
  temperature: { min: 20, max: 35, unit: "°C" },
  // Atmospheric pressure near sea level in Malaysia
  pressure: { min: 95, max: 106, unit: "kPa" },
};

/**
 * 24-hour average operational limits — Class II NWQS
 * Same as 1H for water quality (standards are not time-averaged differently)
 */
export const OPERATIONAL_RANGES_24H = {
  ph: { min: 6.0, max: 9.0, unit: "pH" },
  do: { min: 5.0, max: 20, unit: "mg/L" },
  nh3n: { min: 0, max: 0.3, unit: "mg/L" },
  cod: { min: 0, max: 25, unit: "mg/L" },
  bod: { min: 0, max: 3, unit: "mg/L" },
  tss: { min: 0, max: 50, unit: "mg/L" },
  temperature: { min: 20, max: 35, unit: "°C" },
  pressure: { min: 95, max: 106, unit: "kPa" },
};

// Default export for backward-compat import paths
export const OPERATIONAL_RANGES = OPERATIONAL_RANGES_1H;

// Backward compatibility alias
export const PARAMETER_RANGES = INSTRUMENT_RANGES;
