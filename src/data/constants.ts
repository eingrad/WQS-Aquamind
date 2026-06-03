// src/data/constants.ts
import { useMemo } from "react";
import { useUnits } from "../context/UnitContext";

// Device list
export const DEVICES = [{ id: "PRG01", name: "Pengerang" }];

// Water quality measurement parameters (Malaysia NWQS)
export const PARAMETERS = [
  { key: "wqi", label: "WQI", unit: "" }, // Water Quality Index (dimensionless, 0–100)
  { key: "ph", label: "pH", unit: "pH" },
  { key: "do", label: "Dissolved Oxygen", unit: "mg/L" },
  { key: "nh3n", label: "NH₃-N", unit: "mg/L" },
  { key: "cod", label: "COD", unit: "mg/L" },
  { key: "bod", label: "BOD", unit: "mg/L" },
  { key: "tss", label: "TSS", unit: "mg/L" },
  { key: "temperature", label: "Temperature", unit: "°C" },
  { key: "depth", label: "Depth", unit: "m" },
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

// Malaysia NWQS water quality class labels
export const WQ_CLASSES = ["Class I", "Class II", "Class IIA", "Class IIB", "Class III", "Class IV", "Class V"] as const;
export type WQClass = (typeof WQ_CLASSES)[number];
