/**
 * Map parameter names to database column names
 */
export const PARAMETER_DB_MAP: Record<string, string> = {
  so2: "so2_value",
  h2s: "h2s_value",
  no2: "no2_value",
  btex: "btex_value",
  temperature: "temp_value",
  humidity: "humidity_value",
  windSpeed: "ws_value",
  windDirection: "wd_value",
  solar: "solar_value",
  pressure: "pressure_value",
  rain: "rain_value",
};

/**
 * Map parameter names to their units
 */
export const PARAMETER_UNITS: Record<string, string> = {
  so2: "ppm",
  h2s: "ppm",
  no2: "ppm",
  btex: "ppb",
  temperature: "°C",
  humidity: "%",
  windSpeed: "m/s",
  windDirection: "°",
  solar: "W/m²",
  pressure: "hPa",
  rain: "mm/h",
};
