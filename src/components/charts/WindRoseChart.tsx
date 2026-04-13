import Plot from "react-plotly.js";
import type { Layout, PlotData } from "plotly.js";
import EmptyState from "../common/EmptyState";

const directionSet = {
  N: true,
  NNE: true,
  NE: true,
  ENE: true,
  E: true,
  ESE: true,
  SE: true,
  SSE: true,
  S: true,
  SSW: true,
  SW: true,
  WSW: true,
  W: true,
  WNW: true,
  NW: true,
  NNW: true,
};
type Dir = keyof typeof directionSet;
const DIRECTIONS = Object.keys(directionSet) as Dir[];

const SPEED_RANGES = [
  { label: "0–2 m/s", color: "#1f77b4" },
  { label: "2–5 m/s", color: "#ff7f0e" },
  { label: "5–8 m/s", color: "#2ca02c" },
  { label: "8–10 m/s", color: "#9467bd" },
  { label: "10–15 m/s", color: "#8c564b" },
  { label: "> 15 m/s", color: "#d62728" },
];

type WindMapLayer = Record<Dir, number>;

/**
 * Convert backend data format to Wind Rose chart format
 * Backend: { "N": { "0-1": 5, "1-2": 10, ... }, "NNE": {...}, ... }
 * Chart needs: Array of 6 layers (one per speed range)
 */
function convertBackendToWindMap(backendData: any): WindMapLayer[] {
  const speedBinMapping: Record<string, number> = {
    "0-1": 0,
    "1-2": 0, // 0-2 m/s
    "2-3": 1,
    "3-4": 1,
    "4-5": 1, // 2-5 m/s
    "5-6": 2,
    "6-7": 2, // 5-8 m/s
    "7+": 3, // 8+ m/s (split into remaining ranges)
  };

  const layers: WindMapLayer[] = SPEED_RANGES.map(() =>
    DIRECTIONS.reduce((acc, dir) => {
      acc[dir] = 0;
      return acc;
    }, {} as WindMapLayer),
  );

  // Aggregate backend bins into chart layers
  DIRECTIONS.forEach((dir) => {
    const directionData = backendData[dir] || {};
    Object.entries(directionData).forEach(([bin, value]) => {
      const layerIndex = speedBinMapping[bin];
      if (layerIndex !== undefined) {
        layers[layerIndex][dir] += Number(value) || 0;
      }
    });
  });

  return layers;
}

interface WindRoseChartProps {
  data?: any | null;
  loading?: boolean;
  labelColor?: string;
}

export default function WindRoseChart({
  data,
  loading = false,
  labelColor = "#ffffff",
}: WindRoseChartProps = {}) {
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-teal-400">Loading...</div>
      </div>
    );
  }

  // No data provided — show empty state instead of dummy data
  if (!data?.directions) {
    return (
      <EmptyState
        compact
        title="No Wind Data"
        message="The device may be offline or no wind data has been recorded."
      />
    );
  }

  const windMap = convertBackendToWindMap(data.directions);

  const totalCount = windMap.reduce(
    (sum, layer) => sum + DIRECTIONS.reduce((s, d) => s + layer[d], 0),
    0,
  );

  if (totalCount === 0) {
    return (
      <EmptyState
        compact
        title="No Wind Data"
        message="No wind readings in the current time window."
      />
    );
  }

  const traces: Partial<PlotData>[] = windMap.map((layer, i) => ({
    type: "barpolar",
    r: DIRECTIONS.map((d) => (layer[d] / totalCount) * 100),
    theta: DIRECTIONS,
    name: SPEED_RANGES[i].label,
    marker: { color: SPEED_RANGES[i].color },
    hovertemplate:
      "%{theta}<br>%{r:.1f}%<extra>" + SPEED_RANGES[i].label + "</extra>",
  }));

  const layout: Partial<Layout> = {
    barmode: "stack",
    polar: {
      bgcolor: "rgba(0,0,0,0)",
      radialaxis: {
        ticksuffix: "%",
        tickformat: ".0f",
        angle: 22.5,
        dtick: 10,
        gridcolor: "rgba(255,255,255,0.3)",
        linecolor: "rgba(255,255,255,0.3)",
        tickfont: { color: labelColor },
      },
      angularaxis: {
        rotation: 90,
        direction: "clockwise",
        gridcolor: "rgba(255,255,255,0.3)",
        tickfont: { color: labelColor },
      },
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: labelColor },
    showlegend: true,
    legend: { orientation: "v", x: 1.05, y: 1, font: { color: labelColor } },
  };

  return (
    <div className="w-full h-full">
      <Plot
        data={traces}
        layout={{
          ...layout,
          autosize: true,
          width: undefined,
          height: undefined,
        }}
        config={{ responsive: false, displayModeBar: false }}
        useResizeHandler={false}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
