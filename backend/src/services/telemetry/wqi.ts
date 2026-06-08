/**
 * Malaysia DOE Water Quality Index (WQI)
 *
 * Implements the Department of Environment (JAS) WQI exactly as published in
 * "Standard Kualiti Air Kebangsaan & Indeks Kualiti Air" (NWQS booklet, p.7).
 *
 *   WQI = 0.22·SIDO + 0.19·SIBOD + 0.16·SICOD + 0.15·SIAN + 0.16·SISS + 0.12·SIpH
 *
 * Six parameters are required. If any is missing the WQI is undefined (null) —
 * a partial WQI is not meaningful and is never reported.
 *
 * Note on DO: the DO sub-index uses DISSOLVED OXYGEN IN % SATURATION, not mg/L.
 * Our sensor reports DO in mg/L, so we convert using the measured water
 * temperature (freshwater, ~1 atm) before applying the sub-index equation.
 */

/** Clamp a sub-index to the valid 0–100 range. */
const clamp = (v: number): number => Math.max(0, Math.min(100, v));

/**
 * Dissolved-oxygen saturation concentration (mg/L) at a given water
 * temperature, freshwater at ~1 atm. Standard APHA polynomial fit.
 *   T in °C, valid roughly 0–40 °C.
 */
export const doSaturationMgL = (tempC: number): number =>
  14.652 - 0.41022 * tempC + 0.0079910 * tempC ** 2 - 0.000077774 * tempC ** 3;

/**
 * Convert a DO reading in mg/L to % saturation using water temperature.
 * Returns 0 if the saturation concentration is non-positive (out of range).
 */
export const doPercentSaturation = (doMgL: number, tempC: number): number => {
  const sat = doSaturationMgL(tempC);
  if (sat <= 0) return 0;
  return (doMgL / sat) * 100;
};

// ─── Sub-index equations (NWQS booklet p.7) ─────────────────────────────────

/** SIDO — input x = DO in % saturation. */
export const siDO = (x: number): number => {
  if (x <= 8) return 0;
  if (x >= 92) return 100;
  return clamp(-0.395 + 0.030 * x ** 2 - 0.00020 * x ** 3);
};

/** SIBOD — input x = BOD (mg/L). */
export const siBOD = (x: number): number => {
  if (x <= 5) return clamp(100.4 - 4.23 * x);
  return clamp(108 * Math.exp(-0.055 * x) - 0.1 * x);
};

/** SICOD — input x = COD (mg/L). */
export const siCOD = (x: number): number => {
  if (x <= 20) return clamp(-1.33 * x + 99.1);
  return clamp(103 * Math.exp(-0.0157 * x) - 0.04 * x);
};

/** SIAN — input x = Ammoniacal Nitrogen NH₃-N (mg/L). */
export const siAN = (x: number): number => {
  if (x <= 0.3) return clamp(100.5 - 105 * x);
  if (x < 4) return clamp(94 * Math.exp(-0.573 * x) - 5 * Math.abs(x - 2));
  return 0;
};

/** SISS — input x = Suspended Solids / TSS (mg/L). */
export const siSS = (x: number): number => {
  if (x <= 100) return clamp(97.5 * Math.exp(-0.00676 * x) + 0.05 * x);
  if (x < 1000) return clamp(71 * Math.exp(-0.0016 * x) - 0.015 * x);
  return 0;
};

/** SIpH — input x = pH. */
export const siPH = (x: number): number => {
  if (x < 5.5) return clamp(17.2 - 17.2 * x + 5.02 * x ** 2);
  if (x < 7) return clamp(-242 + 95.5 * x - 6.67 * x ** 2);
  if (x < 8.75) return clamp(-181 + 82.4 * x - 6.05 * x ** 2);
  return clamp(536 - 77.0 * x + 2.76 * x ** 2);
};

// ─── WQI ────────────────────────────────────────────────────────────────────

export interface WqiInputs {
  ph?: number | null;
  do?: number | null; // mg/L
  bod?: number | null; // mg/L
  cod?: number | null; // mg/L
  nh3n?: number | null; // mg/L
  tss?: number | null; // mg/L
  temperature?: number | null; // °C — needed to convert DO mg/L → % saturation
}

const isNum = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

/**
 * Compute the DOE WQI (0–100) from raw parameter values, or null if any of the
 * six required parameters (or the temperature needed for DO % saturation) is
 * missing.
 */
export const computeWQI = (i: WqiInputs): number | null => {
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

  const wqi =
    0.22 * siDO(doPercentSaturation(i.do, i.temperature)) +
    0.19 * siBOD(i.bod) +
    0.16 * siCOD(i.cod) +
    0.15 * siAN(i.nh3n) +
    0.16 * siSS(i.tss) +
    0.12 * siPH(i.ph);

  return Math.round(wqi * 10) / 10; // 1 decimal place
};

/**
 * DOE WQI class (I–V) and status label from a WQI value.
 * Class boundaries per NWQS booklet p.6.
 */
export const classifyWQI = (
  wqi: number | null,
): { class: "I" | "II" | "III" | "IV" | "V"; status: string } | null => {
  if (wqi === null) return null;
  if (wqi > 92.7) return { class: "I", status: "Clean" };
  if (wqi > 76.5) return { class: "II", status: "Clean" };
  if (wqi > 51.9) return { class: "III", status: "Slightly Polluted" };
  if (wqi > 31.0) return { class: "IV", status: "Polluted" };
  return { class: "V", status: "Polluted" };
};
