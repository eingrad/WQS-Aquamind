/**
 * Malaysia NWQS (National Water Quality Standards) Class I–V Ranges
 * Source: Department of Environment Malaysia — Interim National Water
 * Quality Standards for Malaysia (DOE NWQS).
 *
 * Ranges are stored in the parameter's base unit (mg/L, pH units).
 * Temperature and Depth have no NWQS class boundaries and
 * return null — ExposureLimitsDisplay renders nothing for them.
 */

export type NWQSRange = {
  category: string;
  min: number;
  /** Upper bound. `null` means the range has no upper limit. */
  max: number | null;
  color: string;
  bgColor: string;
};

export type NWQSRangeData = {
  baseUnit: string;
  ranges: NWQSRange[];
};

// Kept for backward-compat with ExposureLimitsDisplay import
export type AQIRange = NWQSRange;
export type ExposureRangeData = NWQSRangeData;

export const NWQS_RANGES: Record<string, NWQSRangeData | null> = {
  // pH — bidirectional; optimal band is 6.0–9.0 (Class II)
  ph: {
    baseUnit: "pH",
    ranges: [
      { category: "Very Poor",  min: 0,   max: 5.0,  color: "#ef4444", bgColor: "rgba(239,68,68,0.1)"   },
      { category: "Poor",       min: 5.0,  max: 6.0,  color: "#f97316", bgColor: "rgba(249,115,22,0.1)"  },
      { category: "Good",       min: 6.0,  max: 9.0,  color: "#22c55e", bgColor: "rgba(34,197,94,0.1)"   },
      { category: "Poor",       min: 9.0,  max: 10.0, color: "#f97316", bgColor: "rgba(249,115,22,0.1)"  },
      { category: "Very Poor",  min: 10.0, max: null,  color: "#ef4444", bgColor: "rgba(239,68,68,0.1)"   },
    ],
  },

  // DO (mg/L) — higher is better
  do: {
    baseUnit: "mg/L",
    ranges: [
      { category: "Very Poor (Class V)",  min: 0,   max: 1,   color: "#ef4444", bgColor: "rgba(239,68,68,0.1)"    },
      { category: "Poor (Class IV)",      min: 1,   max: 3,   color: "#f97316", bgColor: "rgba(249,115,22,0.1)"   },
      { category: "Fair (Class III)",     min: 3,   max: 5,   color: "#eab308", bgColor: "rgba(234,179,8,0.1)"    },
      { category: "Good (Class II)",      min: 5,   max: 7,   color: "#22c55e", bgColor: "rgba(34,197,94,0.1)"    },
      { category: "Excellent (Class I)",  min: 7,   max: null, color: "#2563eb", bgColor: "rgba(37, 99, 235,0.1)"  },
    ],
  },

  // NH₃-N (mg/L) — lower is better
  nh3n: {
    baseUnit: "mg/L",
    ranges: [
      { category: "Excellent (Class I)",  min: 0,   max: 0.1,  color: "#2563eb", bgColor: "rgba(37, 99, 235,0.1)"  },
      { category: "Good (Class II)",      min: 0.1, max: 0.3,  color: "#22c55e", bgColor: "rgba(34,197,94,0.1)"   },
      { category: "Fair (Class III)",     min: 0.3, max: 0.9,  color: "#eab308", bgColor: "rgba(234,179,8,0.1)"   },
      { category: "Poor (Class IV)",      min: 0.9, max: 2.7,  color: "#f97316", bgColor: "rgba(249,115,22,0.1)"  },
      { category: "Very Poor (Class V)",  min: 2.7, max: null,  color: "#ef4444", bgColor: "rgba(239,68,68,0.1)"  },
    ],
  },

  // COD (mg/L) — lower is better
  cod: {
    baseUnit: "mg/L",
    ranges: [
      { category: "Excellent (Class I)",  min: 0,   max: 10,   color: "#2563eb", bgColor: "rgba(37, 99, 235,0.1)"  },
      { category: "Good (Class II)",      min: 10,  max: 25,   color: "#22c55e", bgColor: "rgba(34,197,94,0.1)"   },
      { category: "Fair (Class III)",     min: 25,  max: 50,   color: "#eab308", bgColor: "rgba(234,179,8,0.1)"   },
      { category: "Poor (Class IV)",      min: 50,  max: 100,  color: "#f97316", bgColor: "rgba(249,115,22,0.1)"  },
      { category: "Very Poor (Class V)",  min: 100, max: null,  color: "#ef4444", bgColor: "rgba(239,68,68,0.1)"  },
    ],
  },

  // BOD (mg/L) — lower is better
  bod: {
    baseUnit: "mg/L",
    ranges: [
      { category: "Excellent (Class I)",  min: 0,  max: 1,    color: "#2563eb", bgColor: "rgba(37, 99, 235,0.1)"  },
      { category: "Good (Class II)",      min: 1,  max: 3,    color: "#22c55e", bgColor: "rgba(34,197,94,0.1)"   },
      { category: "Fair (Class III)",     min: 3,  max: 6,    color: "#eab308", bgColor: "rgba(234,179,8,0.1)"   },
      { category: "Poor (Class IV)",      min: 6,  max: 12,   color: "#f97316", bgColor: "rgba(249,115,22,0.1)"  },
      { category: "Very Poor (Class V)",  min: 12, max: null,  color: "#ef4444", bgColor: "rgba(239,68,68,0.1)"  },
    ],
  },

  // TSS (mg/L) — lower is better
  tss: {
    baseUnit: "mg/L",
    ranges: [
      { category: "Excellent (Class I)",  min: 0,   max: 25,   color: "#2563eb", bgColor: "rgba(37, 99, 235,0.1)"  },
      { category: "Good (Class II)",      min: 25,  max: 50,   color: "#22c55e", bgColor: "rgba(34,197,94,0.1)"   },
      { category: "Fair (Class III)",     min: 50,  max: 150,  color: "#eab308", bgColor: "rgba(234,179,8,0.1)"   },
      { category: "Poor (Class IV)",      min: 150, max: 300,  color: "#f97316", bgColor: "rgba(249,115,22,0.1)"  },
      { category: "Very Poor (Class V)",  min: 300, max: null,  color: "#ef4444", bgColor: "rgba(239,68,68,0.1)"  },
    ],
  },

  // Physical parameters — no NWQS class breakpoints
  temperature: null,
  depth:       null,
};

// Kept for backward-compat with ExposureLimitsDisplay import
export const EXPOSURE_RANGES = NWQS_RANGES;
