/**
 * Map parameter names to database column names
 */
export const PARAMETER_DB_MAP: Record<string, string> = {
  ph: "ph_value",
  do: "do_value",
  nh3n: "nh3_n_value",
  cod: "cod_value",
  bod: "bod_value",
  tss: "tss_value",
  temperature: "temp_value",
  pressure: "pressure_value",
  depth: "depth_value",
};

/**
 * Map parameter names to their display units
 */
export const PARAMETER_UNITS: Record<string, string> = {
  ph: "pH",
  do: "mg/L",
  nh3n: "mg/L",
  cod: "mg/L",
  bod: "mg/L",
  tss: "mg/L",
  temperature: "°C",
  pressure: "kPa",
  depth: "m",
};
