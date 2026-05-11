import Plot from "react-plotly.js";
import { useUnits } from "../../context/UnitContext";

type Props = {
  data: any[];
  params: string[];
};

/**
 * Find contiguous runs of maintenance buckets and return their [start, end]
 * timestamps in milliseconds.
 *
 * The range is widened by one bucket on each side so the amber band
 * visually matches the dashed maintenance line (which also extends one
 * boundary point on each side so it joins the solid line at the
 * transitions). Both are clamped to the actual data range so we don't
 * draw past the chart edges.
 */
function getMaintenanceRanges(data: any[]): Array<[number, number]> {
  if (!data?.length) return [];

  // Estimate bucket width from the first two points; default to 1 hour.
  const bucketWidth = data.length >= 2 ? data[1].t - data[0].t : 60 * 60 * 1000;
  const dataStart = data[0].t;
  const dataEnd = data[data.length - 1].t + bucketWidth;

  const ranges: Array<[number, number]> = [];
  let runStart: number | null = null;

  for (let i = 0; i < data.length; i++) {
    const inM = !!data[i].inMaintenance;
    if (inM && runStart === null) {
      runStart = data[i].t;
    } else if (!inM && runStart !== null) {
      // Extend each end by one bucket so the band aligns with the
      // dashed maintenance trace's boundary points.
      ranges.push([
        Math.max(runStart - bucketWidth, dataStart),
        Math.min(data[i].t + bucketWidth, dataEnd),
      ]);
      runStart = null;
    }
  }
  if (runStart !== null) {
    ranges.push([Math.max(runStart - bucketWidth, dataStart), dataEnd]);
  }
  return ranges;
}

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

  // True if any selected parameter has at least one maintenance row —
  // controls whether the shared "Maintenance values" legend entry is shown.
  const hasAnyMaintenance = data.some((d: any) =>
    params.some((p) => d?.paramInMaintenance?.[p]),
  );

  // Per parameter we render TWO traces:
  //   1. The main solid line — null at maintenance rows so it breaks.
  //   2. A dashed amber line — present at every maintenance row and at
  //      the immediately adjacent non-maintenance rows, so the dashed
  //      segment visually attaches to the solid line at both ends.
  const traces: Plotly.Data[] = params.flatMap((param, index) => {
    const color = PARAM_COLORS[index % PARAM_COLORS.length];
    const unit = paramToUnit[param];
    const yAxisKey = unitToAxis[unit] || "y";

    const isMaint = (i: number): boolean =>
      !!data[i]?.paramInMaintenance?.[param];

    const mainY = data.map((d, i) => (isMaint(i) ? null : (d[param] ?? null)));

    const maintY = data.map((d, i) => {
      // Include this row OR the immediately adjacent rows so the dashed
      // segment connects to the solid line at the maintenance boundary.
      const includeBoundary = isMaint(i) || isMaint(i - 1) || isMaint(i + 1);
      return includeBoundary ? (d[param] ?? null) : null;
    });

    const mainTrace: Plotly.Data = {
      x: xValues,
      y: mainY,
      type: "scatter",
      mode: "lines",
      name: param.toUpperCase(),
      line: { color, width: 2, dash: "dot" as const },
      yaxis: yAxisKey,
      hovertemplate: `<b><br>${param.toUpperCase()}<br></b>Value: %{y:.4g} ${unit}<extra></extra>`,
      connectgaps: false,
    };

    const maintTrace: Plotly.Data = {
      x: xValues,
      y: maintY,
      type: "scatter",
      mode: "lines",
      // Single shared legend entry across all parameters — the dashed
      // amber colour is universal so reviewers don't see one entry per
      // parameter cluttering the legend.
      name: "Maintenance values",
      legendgroup: "maintenance",
      showlegend: hasAnyMaintenance && index === 0,
      line: { color: "#f59e0b", width: 2, dash: "dash" as const },
      yaxis: yAxisKey,
      hovertemplate: `<b>${param.toUpperCase()} 🔧</b><br>Value: %{y:.4g} ${unit}<br>(maintenance)<extra></extra>`,
      connectgaps: false,
      // Skip maintenance traces in the unified hover tooltip to avoid
      // doubling entries (14 params × 2 traces = 28 rows won't fit).
      //hoverinfo: "skip" as const,
    };

    return [mainTrace, maintTrace];
  });

  // Build Y-axis titles — show all units assigned to each axis
  const leftLabel = leftUnits.join(" · ");
  const rightLabel = rightUnits.join(" · ");

  // Maintenance windows — translucent amber bands rendered behind the lines.
  // The chart line is already broken across these ranges (parameter values
  // are nulled out upstream), so the band explains the gap visually.
  const maintenanceRanges = getMaintenanceRanges(data);
  // Pass shape/annotation x coordinates as raw epoch milliseconds so
  // Plotly treats them the same way as the trace's `new Date(d.t)` x
  // values. ISO strings ending in "Z" are parsed differently from Date
  // objects on a date axis and ended up rendering 8 h off the trace.
  const maintenanceShapes: Partial<Plotly.Shape>[] = maintenanceRanges.map(
    ([x0, x1]) => ({
      type: "rect" as const,
      xref: "x" as const,
      yref: "paper" as const,
      x0: x0,
      x1: x1,
      y0: 0,
      y1: 1,
      fillcolor: "rgba(245, 158, 11, 0.12)",
      line: { width: 0 },
      layer: "below" as const,
    }),
  );
  // One annotation per band, anchored to the band's centre time so the
  // "🔧 Maintenance" pill always sits directly above the band it labels.
  const maintenanceLegend: Partial<Plotly.Annotations>[] =
    maintenanceRanges.map(([x0, x1]) => ({
      xref: "x" as const,
      yref: "paper" as const,
      x: (x0 + x1) / 2,
      y: 1.02,
      xanchor: "center" as const,
      yanchor: "bottom" as const,
      text: "Maintenance",
      showarrow: false,
      font: { size: 11, color: "#f59e0b" },
      bgcolor: "rgba(245, 158, 11, 0.10)",
      bordercolor: "rgba(245, 158, 11, 0.30)",
      borderwidth: 1,
      borderpad: 4,
    }));

  // Build layout with max 2 Y-axes
  const layout: Partial<Plotly.Layout> = {
    plot_bgcolor: "#0a1515",
    paper_bgcolor: "#0a1515",
    font: { color: "#e5e7eb", family: "Inter, system-ui, sans-serif" },
    // Reserve extra top margin when the maintenance badge is shown so
    // it doesn't clip against the chart's top edge.
    margin: {
      t: maintenanceRanges.length > 0 ? 50 : 20,
      b: 60,
      l: 70,
      r: hasRightAxis ? 70 : 30,
    },
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
    shapes: maintenanceShapes,
    annotations: maintenanceLegend,
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
