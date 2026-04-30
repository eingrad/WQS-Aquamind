// src/components/charts/SolarRadiationChart.tsx
import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { getTimeSeriesData } from "../../services/telemetry.service";
import EmptyState from "../common/EmptyState";

interface SolarRadiationChartProps {
  deviceId?: string;
}

export default function SolarRadiationChart({
  deviceId,
}: SolarRadiationChartProps) {
  const [data, setData] = useState<{ time: Date; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    const fetchSolarData = async () => {
      try {
        setLoading(true);

        // Get last 12 hours of solar data at 1-minute intervals
        const now = new Date();
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

        const result = await getTimeSeriesData({
          deviceId,
          startDate: twelveHoursAgo.toISOString(),
          endDate: now.toISOString(),
          interval: "30m", // 30-min buckets for a clean solar curve
          parameters: "solar",
        });

        const transformed = result.timeSeries
          .map((item: any) => {
            const val =
              item.solar_avg !== null && item.solar_avg !== undefined
                ? parseFloat(item.solar_avg)
                : null;
            if (val === null) return null;

            return { time: new Date(item.bucket), value: val };
          })
          .filter(Boolean) as { time: Date; value: number }[];

        // Ensure chronological left-to-right order regardless of API ordering
        transformed.sort((a, b) => a.time.getTime() - b.time.getTime());

        setData(transformed);
      } catch (error) {
        console.error("Failed to fetch solar radiation data:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSolarData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchSolarData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [deviceId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-teal-400">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        compact
        title="No Solar Data"
        message="The device may be offline or no solar radiation data has been recorded."
      />
    );
  }

  return (
    <Plot
      data={[
        {
          x: data.map((d) => d.time),
          y: data.map((d) => d.value),
          type: "scatter",
          mode: "lines+markers",
          fill: "tozeroy",
          name: "Solar Radiation",
          line: { color: "#facc15", width: 3 },
          marker: { color: "#facc15", size: 4 },
          fillcolor: "rgba(250, 204, 21, 0.1)",
        },
      ]}
      layout={{
        title: { text: "Solar Radiation (W/m²)" },
        xaxis: {
          title: { text: "Time" },
          type: "date",
          tickformat: "%H:%M",
          tickfont: { color: "#cbd5e1" },
        },
        yaxis: {
          title: { text: "Radiation (W/m²)" },
          rangemode: "tozero",
          tickfont: { color: "#cbd5e1" },
        },
        plot_bgcolor: "#0f1a1a",
        paper_bgcolor: "#0f1a1a",
        font: { color: "#f8fafc" },
        margin: { t: 40, b: 40, l: 60, r: 30 },
      }}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
      config={{ responsive: true }}
    />
  );
}