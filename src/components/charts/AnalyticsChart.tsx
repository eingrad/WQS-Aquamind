import Plot from "react-plotly.js";
import { useUnits } from "../../context/UnitContext";

type Props = {
  data: any[];
  params: string[];
};

const PARAM_COLORS = [
  "#14b8a6",
  "#a855f7",
  "#f97316",
  "#eab308",
  "#ec4899",
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f43f5e",
];

export default function AnalyticsChart({ data, params }: Props) {
  const { getUnit } = useUnits();

  // Build unit → axis mapping (max 2 visible Y-axes)
  const paramToUnit: Record<string, string> = {};
  params.forEach((param) => {
    paramToUnit[param] = getUnit(param);
  });

  // Collect unique units in order of appearance
  const allUniqueUnits: string[] = [];
  params.forEach((param) => {
    const unit = paramToUnit[param];
    if (!allUniqueUnits.includes(unit)) allUniqueUnits.push(unit);
  });

  // Cap at 2 Y-axes — units beyond the 2nd are grouped onto the left axis
  const leftUnits = [allUniqueUnits[0]];
  const rightUnits: string[] = [];

  if (allUniqueUnits.length > 1) {
    rightUnits.push(allUniqueUnits[1]);
  }

  // Any extra units (3rd, 4th, …) go to the left axis
  for (let i = 2; i < allUniqueUnits.length; i++) {
    leftUnits.push(allUniqueUnits[i]);
  }

  // Map each unit to its axis key ("y" = left, "y2" = right)
  const unitToAxis: Record<string, string> = {};
  leftUnits.forEach((u) => (unitToAxis[u] = "y"));
  rightUnits.forEach((u) => (unitToAxis[u] = "y2"));

  const hasRightAxis = rightUnits.length > 0;

  // Build Plotly traces
  const xValues = data.map((d) => new Date(d.t));

  const traces: Plotly.Data[] = params.map((param, index) => {
    const color = PARAM_COLORS[index % PARAM_COLORS.length];
    const unit = paramToUnit[param];
    const yAxisKey = unitToAxis[unit] || "y";

    return {
      x: xValues,
      y: data.map((d) => d[param] ?? null),
      type: "scatter" as const,
      mode: "lines" as const,
      name: param.toUpperCase(),
      line: { color, width: 2, dash: "dot" as const },
      yaxis: yAxisKey,
      hovertemplate: `<b><br>${param.toUpperCase()}<br></b>Value: %{y:.4g} ${unit}<extra></extra>`,
      connectgaps: false,
    };
  });

  // Build Y-axis titles — show all units assigned to each axis
  const leftLabel = leftUnits.join(" · ");
  const rightLabel = rightUnits.join(" · ");

  // Build layout with max 2 Y-axes
  const layout: Partial<Plotly.Layout> = {
    plot_bgcolor: "#0a1515",
    paper_bgcolor: "#0a1515",
    font: { color: "#e5e7eb", family: "Inter, system-ui, sans-serif" },
    margin: { t: 20, b: 60, l: 70, r: hasRightAxis ? 70 : 30 },
    legend: {
      orientation: "h" as const,
      y: -0.15,
      x: 0.5,
      xanchor: "center" as const,
      font: { size: 12, color: "#e5e7eb" },
      bgcolor: "transparent",
    },
    hovermode: "x unified" as const,
    xaxis: {
      type: "date" as const,
      linecolor: "#ffffff",
      tickfont: { color: "#cbd5e1", size: 12 },
      tickcolor: "#ffffff",
      showspikes: true,
      spikecolor: "#f7f7f7ff",
      spikethickness: 1,
      spikedash: "solid",
    },
    yaxis: {
      title: {
        text: leftLabel,
        font: { size: 11, color: "#94a3b8" },
      },
      gridcolor: "rgba(255,255,255,0.08)",
      zeroline: false,
      tickfont: { color: "#cbd5e1", size: 12 },
    },
    dragmode: "zoom" as const,
  };

  // Add second Y-axis only if there's a right-side unit
  if (hasRightAxis) {
    (layout as any).yaxis2 = {
      title: {
        text: rightLabel,
        font: { size: 11, color: "#94a3b8" },
      },
      overlaying: "y",
      side: "right",
      showgrid: false,
      zeroline: false,
      tickfont: { color: "#cbd5e1", size: 12 },
    };
  }

  return (
    <Plot
      data={traces}
      layout={layout}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
      config={{
        responsive: true,
        displaylogo: false,
        toImageButtonOptions: {
          format: "png",
          filename: `analytics_${params.join("-")}_${new Date().toISOString().split("T")[0]}`,
          height: 600,
          width: 1200,
          scale: 2,
        },
        modeBarButtonsToRemove: ["lasso2d", "select2d"],
      }}
    />
  );
}
