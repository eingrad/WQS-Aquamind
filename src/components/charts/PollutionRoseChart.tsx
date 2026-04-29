import Plot from "react-plotly.js";
import type { Layout, PlotData } from "plotly.js";

const DIRECTIONS = [
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
];

const CONCENTRATION_COLORS = [
  "#22d3ee", // Low
  "#10b981", // Medium
  "#eab308", // High
  "#f97316", // Very High
  "#ef4444", // Hazardous
];

/**
 * Pretty-print a parameter code with subscripts/lowercase suffixes
 *   so2 → SO₂, h2s → H₂S, no2 → NO₂, no → NO, nox → NOx, btex → BTEX
 */
function formatGasName(parameter: string | undefined): string {
  if (!parameter) return "";
  switch (parameter.toLowerCase()) {
    case "so2":
      return "SO₂";
    case "h2s":
      return "H₂S";
    case "no2":
      return "NO₂";
    case "benzene":
      return "Benzene";
    case "toluene":
      return "Toluene";
    case "ethylbenzene":
      return "Ethylbenzene";
    case "mp_xylene":
      return "m,p-Xylene";
    case "o_xylene":
      return "o-Xylene";
    default:
      return parameter.toUpperCase();
  }
}

/**
 * Convert backend data to Plotly format
 * Backend: { "N": { "low": 5, "moderate": 8, ... }, ...}
 * Plotly needs: Array of traces, one per concentration bin
 */
function convertBackendToPollutionRose(
  backendData: any,
  displayDirections: string[],
  parameter?: string,
): Partial<PlotData>[] {
  if (!backendData) return [];

  // Get all unique bins from first direction
  const firstDir = DIRECTIONS[0];
  const bins = Object.keys(backendData[firstDir] || {});
  const gas = formatGasName(parameter);

  /// Create one trace per bin — legend entries include the gas name so it's
  // obvious which pollutant the rose represents (e.g., "SO₂ — low").
  return bins.map((bin, index) => ({
    type: "barpolar",
    r: DIRECTIONS.map((dir) => Number(backendData[dir]?.[bin]) || 0),
    theta: displayDirections,
    name: gas ? `${gas} — ${bin}` : bin,
    marker: {
      color: CONCENTRATION_COLORS[index % CONCENTRATION_COLORS.length],
    },
  }));
}

/**
 * Shift a 16-point compass direction by 180°
 */
const OPPOSITE_DIR: Record<string, string> = {
  N: "S",
  NNE: "SSW",
  NE: "SW",
  ENE: "WSW",
  E: "W",
  ESE: "WNW",
  SE: "NW",
  SSE: "NNW",
  S: "N",
  SSW: "NNE",
  SW: "NE",
  WSW: "ENE",
  W: "E",
  WNW: "ESE",
  NW: "SE",
  NNW: "SSE",
};

interface PollutionRoseChartProps {
  data?: any | null;
  loading?: boolean;
  directionMode?: "from" | "to";
}

export default function PollutionRoseChart({
  data,
  loading = false,
  directionMode = "from",
}: PollutionRoseChartProps = {}) {
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-400">Loading pollution data...</div>
      </div>
    );
  }

  // Apply direction shift for "Direction To" mode
  const displayDirections =
    directionMode === "to"
      ? DIRECTIONS.map((d) => OPPOSITE_DIR[d] || d)
      : DIRECTIONS;

  // Convert backend data or use dummy data
  const traces = data?.directions
    ? convertBackendToPollutionRose(data.directions, displayDirections)
    : generateDummyTraces();

  const layout: Partial<Layout> = {
    barmode: "stack",
    polar: {
      bgcolor: "#0f1a1a",
      angularaxis: {
        direction: "clockwise",
        rotation: 90,
        tickfont: { color: "#cbd5e1", size: 12 },
      },
      radialaxis: {
        ticksuffix: "",
        showline: true,
        gridcolor: "#1e293b",
        tickfont: { color: "#ffffff" },
      },
    },
    showlegend: true,
    paper_bgcolor: "#0f1a1a",
    plot_bgcolor: "#0f1a1a",
    font: { color: "#f8fafc" },
    margin: { t: 20, b: 20, l: 20, r: 20 },
    legend: {
      orientation: "h",
      x: 0.5,
      xanchor: "center",
      y: -0.2,
    },
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
      config={{ responsive: true, displayModeBar: false }}
    />
  );
}

/**
 * Generate dummy data for development/fallback
 */
function generateDummyTraces(): Partial<PlotData>[] {
  const dummyData = [
    { angle: "N", so2: 12 },
    { angle: "NE", so2: 15 },
    { angle: "E", so2: 10 },
    { angle: "SE", so2: 8 },
    { angle: "S", so2: 14 },
    { angle: "SW", so2: 11 },
    { angle: "W", so2: 9 },
    { angle: "NW", so2: 13 },
  ];

  return [
    {
      type: "barpolar",
      r: dummyData.map((d) => d.so2),
      theta: dummyData.map((d) => d.angle),
      name: "SO₂",
      marker: { color: "#22d3ee" },
    },
  ];
}
