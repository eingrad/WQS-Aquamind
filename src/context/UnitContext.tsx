import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  DEFAULT_UNITS,
  UNIT_OPTIONS,
  convertValue,
  getDisplayUnit,
} from "../utils/unitConversion";
import { getStorageItem, setStorageItem } from "../utils/storage";

const STORAGE_KEY = "userUnitPreferences";

export interface UnitContextType {
  /** Current user unit preferences keyed by parameter */
  units: Record<string, string>;

  /** Update the unit for a specific parameter */
  setUnit: (parameter: string, unit: string) => void;

  /** Reset all units to backend defaults */
  resetUnits: () => void;

  /** Convert a value from backend base unit to user's selected unit */
  convert: (value: number | null | undefined, parameter: string) => number | null;

  /** Get the display unit string for a parameter */
  getUnit: (parameter: string) => string;

  /** Get available unit options for a parameter */
  getOptions: (parameter: string) => string[];
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<Record<string, string>>(() => {
    // Load from localStorage on init
    const saved = getStorageItem<Record<string, string>>(STORAGE_KEY);
    return saved && typeof saved === "object" ? { ...DEFAULT_UNITS, ...saved } : { ...DEFAULT_UNITS };
  });

  // Persist to localStorage whenever units change
  useEffect(() => {
    setStorageItem(STORAGE_KEY, units);
  }, [units]);

  const setUnit = (parameter: string, unit: string) => {
    setUnits((prev) => ({ ...prev, [parameter]: unit }));
  };

  const resetUnits = () => {
    setUnits({ ...DEFAULT_UNITS });
  };

  const convert = (value: number | null | undefined, parameter: string): number | null => {
    return convertValue(value, parameter, units[parameter] || DEFAULT_UNITS[parameter]);
  };

  const getUnit = (parameter: string): string => {
    return getDisplayUnit(parameter, units);
  };

  const getOptions = (parameter: string): string[] => {
    return UNIT_OPTIONS[parameter] || [];
  };

  return (
    <UnitContext.Provider
      value={{ units, setUnit, resetUnits, convert, getUnit, getOptions }}
    >
      {children}
    </UnitContext.Provider>
  );
}

/**
 * Hook to access unit conversion context
 */
export function useUnits(): UnitContextType {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error("useUnits must be used within a UnitProvider");
  }
  return context;
}
