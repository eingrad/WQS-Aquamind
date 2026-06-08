/**
 * Malaysia DOE Water Quality Index (WQI) — frontend mirror of
 * backend/src/services/telemetry/wqi.ts.
 *
 *   WQI = 0.22·SIDO + 0.19·SIBOD + 0.16·SICOD + 0.15·SIAN + 0.16·SISS + 0.12·SIpH
 *
 * Kept in sync with the backend so the live gauge can compute WQI + the six
 * sub-index scores directly from the current readings, without a round-trip.
 * Equations per the NWQS booklet (p.7); DO is converted mg/L → % saturation
 * using water temperature before its sub-index is applied.
 */

const clamp = (v: number): number => Math.max(0, Math.min(100, v));

/** DO saturation concentration (mg/L), freshwater ~1 atm. T in °C. */
export const doSaturationMgL = (tempC: number): number =>
  14.652 - 0.41022 * tempC + 0.0079910 * tempC ** 2 - 0.000077774 * tempC ** 3;

/** Convert DO mg/L → % saturation using water temperature. */
export const doPercentSaturation = (doMgL: number, tempC: number): number => {
  const sat = doSaturationMgL(tempC);
  if (sat <= 0) return 0;
  return (doMgL / sat) * 100;
};

// ─── Sub-index equations (NWQS booklet p.7) ─────────────────────────────────

export const siDO = (x: number): number => {
  if (x <= 8) return 0;
  if (x >= 92) return 100;
  return clamp(-0.395 + 0.030 * x ** 2 - 0.00020 * x ** 3);
};

export const siBOD = (x: number): number =>
  x <= 5 ? clamp(100.4 - 4.23 * x) : clamp(108 * Math.exp(-0.055 * x) - 0.1 * x);

export const siCOD = (x: number): number =>
  x <= 20 ? clamp(-1.33 * x + 99.1) : clamp(103 * Math.exp(-0.0157 * x) - 0.04 * x);

export const siAN = (x: number): number => {
  if (x <= 0.3) return clamp(100.5 - 105 * x);
  if (x < 4) return clamp(94 * Math.exp(-0.573 * x) - 5 * Math.abs(x - 2));
  return 0;
};

export const siSS = (x: number): number => {
  if (x <= 100) return clamp(97.5 * Math.exp(-0.00676 * x) + 0.05 * x);
  if (x < 1000) return clamp(71 * Math.exp(-0.0016 * x) - 0.015 * x);
  return 0;
};

export const siPH = (x: number): number => {
  if (x < 5.5) return clamp(17.2 - 17.2 * x + 5.02 * x ** 2);
  if (x < 7) return clamp(-242 + 95.5 * x - 6.67 * x ** 2);
  if (x < 8.75) return clamp(-181 + 82.4 * x - 6.05 * x ** 2);
  return clamp(536 - 77.0 * x + 2.76 * x ** 2);
};

// ─── WQI + breakdown ────────────────────────────────────────────────────────

export interface WqiInputs {
  ph?: number | null;
  do?: number | null;
  bod?: number | null;
  cod?: number | null;
  nh3n?: number | null;
  tss?: number | null;
  temperature?: number | null;
}

export interface SubIndex {
  key: "do" | "bod" | "cod" | "nh3n" | "tss" | "ph";
  label: string;
  weight: number;
  score: number; // 0–100 sub-index
}

export interface WqiResult {
  wqi: number;
  class: "I" | "II" | "III" | "IV" | "V";
  status: string;
  subIndices: SubIndex[];
}

const isNum = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

/** DOE WQI class + status from a WQI value (NWQS booklet p.6). */
export const classifyWQI = (
  wqi: number,
): { class: WqiResult["class"]; status: string } => {
  if (wqi > 92.7) return { class: "I", status: "Clean" };
  if (wqi > 76.5) return { class: "II", status: "Clean" };
  if (wqi > 51.9) return { class: "III", status: "Slightly Polluted" };
  if (wqi > 31.0) return { class: "IV", status: "Polluted" };
  return { class: "V", status: "Polluted" };
};

/**
 * Compute WQI plus the six sub-index scores, or null if any required input
 * (incl. temperature for DO % saturation) is missing.
 */
export const computeWqiBreakdown = (i: WqiInputs): WqiResult | null => {
  if (
    !isNum(i.ph) ||
    !isNum(i.do) ||
    !isNum(i.bod) ||
    !isNum(i.cod) ||
    !isNum(i.nh3n) ||
    !isNum(i.tss) ||
    !isNum(i.temperature)
  ) {
    return null;
  }

  const subIndices: SubIndex[] = [
    { key: "do", label: "DO", weight: 0.22, score: siDO(doPercentSaturation(i.do, i.temperature)) },
    { key: "bod", label: "BOD", weight: 0.19, score: siBOD(i.bod) },
    { key: "cod", label: "COD", weight: 0.16, score: siCOD(i.cod) },
    { key: "nh3n", label: "NH₃-N", weight: 0.15, score: siAN(i.nh3n) },
    { key: "tss", label: "TSS", weight: 0.16, score: siSS(i.tss) },
    { key: "ph", label: "pH", weight: 0.12, score: siPH(i.ph) },
  ];

  const wqiRaw = subIndices.reduce((sum, s) => sum + s.weight * s.score, 0);
  const wqi = Math.round(wqiRaw * 10) / 10;

  return { wqi, subIndices, ...classifyWQI(wqi) };
};

/**
 * Colour for a 0–100 quality score (used for both the WQI gauge and the
 * sub-index bars). Matches the NWQS class palette.
 */
export const wqiColor = (score: number): string => {
  if (score > 92.7) return "#2563eb"; // Class I  — blue
  if (score > 76.5) return "#22c55e"; // Class II — green
  if (score > 51.9) return "#eab308"; // Class III — yellow
  if (score > 31.0) return "#f97316"; // Class IV — orange
  return "#ef4444"; //                   Class V  — red
};
