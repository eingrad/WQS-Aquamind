/**
 * Map parameter names to database column names
 */
export const PARAMETER_DB_MAP: Record<string, string> = {
  so2: "so2_value",
  h2s: "h2s_value",
  no2: "no2_value",
  no: "no_value",
  nox: "nox_value",
  // BTEX components (Synspec GC955)
  benzene: "benzene_value",
  toluene: "toluene_value",
  ethylbenzene: "ethylbenzene_value",
  xylenes: "xylenes_value",
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
  so2: "ppb",
  h2s: "ppb",
  no2: "ppb",
  no: "ppb",
  nox: "ppb",
  benzene: "ppb",
  toluene: "ppb",
  ethylbenzene: "ppb",
  xylenes: "ppb",
  temperature: "°C",
  humidity: "%",
  windSpeed: "m/s",
  windDirection: "°",
  solar: "W/m²",
  pressure: "hPa",
  rain: "mm/h",
};
