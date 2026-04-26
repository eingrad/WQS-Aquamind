import { useEffect, useState, useRef } from "react";
import { PARAMETERS } from "../../data/constants";
import { getTimeSeriesData } from "../../services/telemetry.service";
import { useUnits } from "../../context/UnitContext";

interface LiveChartWidgetProps {
  deviceId: string;
  parameters: string[];
}

interface DataPoint {
  t: number;
  [key: string]: number | null;
}

const CHART_COLORS = [
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ec4899", // pink
];

export default function LiveChartWidget({ deviceId, parameters }: LiveChartWidgetProps) {
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getUnit } = useUnits();

  useEffect(() => {
    if (!deviceId) return;

    const fetchData = async () => {
      try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const data = await getTimeSeriesData({
          deviceId,
          startDate: oneHourAgo.toISOString(),
          endDate: now.toISOString(),
          interval: "1m",
          parameters: parameters.join(","),
        });

        const transformed: DataPoint[] = data.timeSeries.map((item: any) => {
          const result: any = { t: new Date(item.bucket).getTime() };
          parameters.forEach((param) => {
            let avgKey = `${param}_avg`;
            if (param === "windSpeed") avgKey = "windspeed_avg";
            else if (param === "windDirection") avgKey = "winddirection_avg";
            result[param] = item[avgKey] !== null && item[avgKey] !== undefined
              ? parseFloat(item[avgKey])
              : null;
          });
          return result;
        });

        setChartData(transformed.reverse());
      } catch (err) {
        console.error("LiveChart: fetch failed", err);
        setChartData([]);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [deviceId, parameters.join(",")]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || chartData.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Find global min/max for y-axis
    let yMin = Infinity;
    let yMax = -Infinity;
    parameters.forEach((p) => {
      chartData.forEach((d) => {
        if (d[p] !== null && d[p] !== undefined) {
          const v = d[p] as number;
          if (v < yMin) yMin = v;
          if (v > yMax) yMax = v;
        }
      });
    });

    if (yMin === Infinity) { yMin = 0; yMax = 1; }
    const yRange = yMax - yMin || 1;
    const yPad = yRange * 0.1;
    yMin -= yPad;
    yMax += yPad;

    const xMin = chartData[0]?.t || 0;
    const xMax = chartData[chartData.length - 1]?.t || 1;
    const xRange = xMax - xMin || 1;

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const y = padding.top + (i / yTicks) * plotH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotW, y);
      ctx.stroke();

      // Y-axis labels
      const val = yMax - (i / yTicks) * (yMax - yMin);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(val.toFixed(2), padding.left - 8, y + 4);
    }

    // X-axis labels
    const xTicks = 6;
    ctx.textAlign = "center";
    for (let i = 0; i <= xTicks; i++) {
      const t = xMin + (i / xTicks) * xRange;
      const x = padding.left + (i / xTicks) * plotW;
      const date = new Date(t);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(
        `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`,
        x,
        height - padding.bottom + 20
      );
    }

    // Draw lines for each parameter
    parameters.forEach((param, paramIdx) => {
      const color = CHART_COLORS[paramIdx % CHART_COLORS.length];
      const points: { x: number; y: number }[] = [];

      chartData.forEach((d) => {
        if (d[param] !== null && d[param] !== undefined) {
          const x = padding.left + ((d.t - xMin) / xRange) * plotW;
          const y = padding.top + ((yMax - (d[param] as number)) / (yMax - yMin)) * plotH;
          points.push({ x, y });
        }
      });

      if (points.length < 2) return;

      // Gradient fill under line
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotH);
      gradient.addColorStop(0, color + "30");
      gradient.addColorStop(1, color + "00");

      ctx.beginPath();
      ctx.moveTo(points[0].x, padding.top + plotH);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, padding.top + plotH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Latest value dot
      const last = points[points.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [chartData, parameters]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      // Trigger re-render to redraw canvas
      setChartData((prev) => [...prev]);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0d1717] border border-white/10 rounded-xl p-6 h-[350px] flex items-center justify-center">
        <div className="text-teal-400 animate-pulse">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1717] border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/70 text-sm font-medium">Live Trend — Last 1 Hour</h3>
        <div className="flex gap-4">
          {parameters.map((p, i) => {
            const meta = PARAMETERS.find((pm) => pm.key === p);
            return (
              <div key={p} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-1 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-xs text-white/50">
                  {meta?.label || p} ({getUnit(p)})
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div ref={containerRef} className="w-full h-[280px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/30 text-sm">
            No data available
          </div>
        ) : (
          <canvas ref={canvasRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
}
