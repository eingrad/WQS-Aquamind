import { useEffect, useState, useRef } from "react";
import { PARAMETERS } from "../../data/constants";
import { getRealTimeParams } from "../../services/liveData.service";
import { getLatestReadings } from "../../services/telemetry.service";
import { useUnits } from "../../context/UnitContext";
import { formatPollutantValue } from "../../utils/numberFormat";

interface ParameterCardsWidgetProps {
  deviceId: string;
  parameters: string[];
}

interface ParamHistory {
  values: number[];
  timestamps: number[];
}

export default function ParameterCardsWidget({ deviceId, parameters }: ParameterCardsWidgetProps) {
  const [liveData, setLiveData] = useState<Record<string, number>>({});
  const [prevData, setPrevData] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<Record<string, ParamHistory>>({});
  const [loading, setLoading] = useState(true);
  const { convert, getUnit } = useUnits();
  const historyRef = useRef(history);
  historyRef.current = history;

  useEffect(() => {
    if (!deviceId) return;

    const fetchData = async () => {
      try {
        const data = await getRealTimeParams(deviceId);
        setPrevData((prev) => ({ ...prev, ...liveData }));
        setLiveData(data.readings);

        // Update sparkline history
        const now = Date.now();
        const newHistory = { ...historyRef.current };
        for (const key of parameters) {
          if (data.readings[key] !== undefined) {
            if (!newHistory[key]) newHistory[key] = { values: [], timestamps: [] };
            newHistory[key].values.push(data.readings[key]);
            newHistory[key].timestamps.push(now);
            // Keep last 60 data points (10 minutes at 10s interval)
            if (newHistory[key].values.length > 60) {
              newHistory[key].values.shift();
              newHistory[key].timestamps.shift();
            }
          }
        }
        setHistory(newHistory);
      } catch {
        try {
          const readings = await getLatestReadings(deviceId, 1);
          if (readings.length > 0) {
            const latest = readings[0];
            const mapped: Record<string, number> = {};
            const keyMap: Record<string, string> = {
              so2: "so2Value", h2s: "h2sValue", no2: "no2Value",
              btex: "btexValue", temperature: "tempValue",
              humidity: "humidityValue", windSpeed: "wsValue",
              windDirection: "wdValue", solar: "solarValue",
              pressure: "pressureValue", rain: "rainValue",
            };
            for (const p of parameters) {
              if (keyMap[p] && latest[keyMap[p]]) mapped[p] = parseFloat(latest[keyMap[p]]);
            }
            setLiveData(mapped);
          }
        } catch (err) {
          console.error("ParameterCards: fallback failed", err);
        }
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [deviceId, parameters.join(",")]);

  // Sparkline SVG
  const renderSparkline = (key: string) => {
    const h = history[key];
    if (!h || h.values.length < 2) return null;

    const width = 120;
    const height = 32;
    const padding = 2;

    const min = Math.min(...h.values);
    const max = Math.max(...h.values);
    const range = max - min || 1;

    const points = h.values.map((v, i) => {
      const x = padding + (i / (h.values.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((v - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return (
      <svg width={width} height={height} className="mt-2 opacity-60">
        <defs>
          <linearGradient id={`spark-${key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Fill area */}
        <polygon
          points={`${padding},${height - padding} ${points.join(" ")} ${width - padding},${height - padding}`}
          fill={`url(#spark-${key})`}
        />
        {/* Line */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  const getTrend = (key: string) => {
    const prev = prevData[key];
    const curr = liveData[key];
    if (prev === undefined || curr === undefined) return null;
    if (curr > prev) return "up";
    if (curr < prev) return "down";
    return "stable";
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {parameters.map((p) => (
          <div key={p} className="bg-[#0d1717] border border-white/10 rounded-xl p-5 animate-pulse h-[140px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {parameters.map((key) => {
        const meta = PARAMETERS.find((p) => p.key === key);
        const rawValue = liveData[key];
        const displayValue = rawValue !== undefined ? convert(rawValue, key) ?? rawValue : null;
        const formatted = displayValue !== null ? formatPollutantValue(displayValue, key) : "--";
        const unit = getUnit(key);
        const trend = getTrend(key);

        return (
          <div
            key={key}
            className="relative bg-gradient-to-br from-[#0d1717] to-[#0a1414] border border-white/10 rounded-xl p-5 backdrop-blur-sm overflow-hidden group hover:border-teal-500/30 transition-all duration-500"
          >
            {/* Glow effect */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all duration-500" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/50 text-xs font-medium uppercase tracking-wider">
                  {meta?.label || key}
                </span>
                {trend && (
                  <span className={`text-xs ${trend === "up" ? "text-red-400" : trend === "down" ? "text-green-400" : "text-white/30"}`}>
                    {trend === "up" ? "▲" : trend === "down" ? "▼" : "━"}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white font-mono tabular-nums">
                  {formatted}
                </span>
                <span className="text-xs text-white/40">{unit}</span>
              </div>

              {renderSparkline(key)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
