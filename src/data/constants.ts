// src/data/constants.ts
import { useMemo } from "react";
import { useUnits } from "../context/UnitContext";

// Device list
export const DEVICES = [{ id: "PRG01", name: "Pengerang" }];

// Measurement parameters (static base units — used for keys/labels reference)
export const PARAMETERS = [
  { key: "so2", label: "SO₂", unit: "ppb" },
  { key: "h2s", label: "H₂S", unit: "ppb" },
  { key: "no2", label: "NO₂", unit: "ppb" },
  // BTEX is shown as 5 individual isomer rows. The total Xylene sum
  // (mp + o) is only computed at report-generation time, not displayed live.
  { key: "benzene", label: "Benzene", unit: "ppb" },
  { key: "toluene", label: "Toluene", unit: "ppb" },
  { key: "ethylbenzene", label: "Ethylbenzene", unit: "ppb" },
  { key: "mp_xylene", label: "m,p-Xylene", unit: "ppb" },
  { key: "o_xylene", label: "o-Xylene", unit: "ppb" },
  { key: "solar", label: "Solar Radiation", unit: "W/m²" },
  { key: "temperature", label: "Temperature", unit: "°C" },
  { key: "humidity", label: "Humidity", unit: "%" },
  { key: "pressure", label: "Pressure", unit: "hPa" },
  { key: "rain", label: "Rain", unit: "mm/h" },
  { key: "windSpeed", label: "Wind Speed", unit: "m/s" },
  { key: "windDirection", label: "Wind Direction", unit: "°" },
];

/**
 * Hook that returns PARAMETERS with dynamic units from user preferences.
 * Use this in components that display units to the user.
 */
export function useParametersWithUnits() {
  const { getUnit } = useUnits();

  return useMemo(
    () =>
      PARAMETERS.map((p) => ({
        ...p,
        unit: getUnit(p.key),
      })),
    [getUnit],
  );
}

// Wind directions (16-point compass)
export const WIND_DIRS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;

// Windrose bin keys (m/s or concentration bands)
export const WINDROSE_BIN_KEYS = [
  "0-1",
  "1-2",
  "2-3",
  "3-4",
  "4-5",
  "5-6",
  "6-7",
  "7+",
] as const;

export type BinKey = (typeof WINDROSE_BIN_KEYS)[number];
