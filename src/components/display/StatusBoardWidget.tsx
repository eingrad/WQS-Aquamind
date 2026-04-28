import { useEffect, useState } from "react";
import { PARAMETERS } from "../../data/constants";
import { getRealTimeParams } from "../../services/liveData.service";
import { getLatestReadings } from "../../services/telemetry.service";
import { useUnits } from "../../context/UnitContext";
import { formatPollutantValue } from "../../utils/numberFormat";

interface StatusBoardWidgetProps {
  deviceId: string;
  parameters: string[];
}

// Default thresholds for status coloring
const DEFAULT_THRESHOLDS: Record<
  string,
  { warning: number; critical: number }
> = {
  so2: { warning: 0.2, critical: 0.5 },
  h2s: { warning: 0.02, critical: 0.05 },
  no2: { warning: 0.2, critical: 0.5 },
  btex: { warning: 30, critical: 70 },
  temperature: { warning: 35, critical: 40 },
  humidity: { warning: 80, critical: 90 },
  pressure: { warning: 1020, critical: 1030 },
  windSpeed: { warning: 10, critical: 15 },
  solar: { warning: 800, critical: 1000 },
  rain: { warning: 10, critical: 30 },
  windDirection: { warning: 999, critical: 999 }, // no threshold for direction
};

export default function StatusBoardWidget({
  deviceId,
  parameters,
}: StatusBoardWidgetProps) {
  const [liveData, setLiveData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { convert, getUnit } = useUnits();

  useEffect(() => {
    if (!deviceId) return;

    const fetchData = async () => {
      try {
        const data = await getRealTimeParams(deviceId);
        // Flatten { value, at } entries to plain numbers for this widget
        const flat: Record<string, number> = {};
        for (const [key, entry] of Object.entries(data.readings)) {
          if (entry) flat[key] = entry.value;
        }
        setLiveData(flat);
      } catch {
        try {
          const readings = await getLatestReadings(deviceId, 1);
          if (readings.length > 0) {
            const latest = readings[0];
            const mapped: Record<string, number> = {};
            const keyMap: Record<string, string> = {
              so2: "so2Value",
              h2s: "h2sValue",
              no2: "no2Value",
              btex: "btexValue",
              temperature: "tempValue",
              humidity: "humidityValue",
              windSpeed: "wsValue",
              windDirection: "wdValue",
              solar: "solarValue",
              pressure: "pressureValue",
              rain: "rainValue",
            };
            for (const p of parameters) {
              if (keyMap[p] && latest[keyMap[p]])
                mapped[p] = parseFloat(latest[keyMap[p]]);
            }
            setLiveData(mapped);
          }
        } catch (err) {
          console.error("StatusBoard: fallback failed", err);
        }
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [deviceId, parameters.join(",")]);

  const getStatus = (key: string, value: number | undefined) => {
    if (value === undefined)
      return { color: "#374151", label: "No Data", bg: "bg-gray-800/30" };
    const thresholds = DEFAULT_THRESHOLDS[key] || { warning: 50, critical: 80 };
    if (value >= thresholds.critical)
      return { color: "#ef4444", label: "Critical", bg: "bg-red-500/10" };
    if (value >= thresholds.warning)
      return { color: "#f59e0b", label: "Warning", bg: "bg-amber-500/10" };
    return { color: "#10b981", label: "Normal", bg: "bg-emerald-500/10" };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {parameters.map((p) => (
          <div
            key={p}
            className="bg-[#0d1717] border border-white/10 rounded-xl p-4 animate-pulse h-[100px]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#0d1717] border border-white/10 rounded-xl p-6">
      <h3 className="text-white/70 text-sm font-medium mb-4">
        Parameter Status
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {parameters.map((key) => {
          const meta = PARAMETERS.find((p) => p.key === key);
          const rawValue = liveData[key];
          const displayValue =
            rawValue !== undefined
              ? (convert(rawValue, key) ?? rawValue)
              : null;
          const formatted =
            displayValue !== null
              ? formatPollutantValue(displayValue, key)
              : "--";
          const unit = getUnit(key);
          const status = getStatus(key, rawValue);

          return (
            <div
              key={key}
              className={`relative border border-white/5 rounded-lg p-4 ${status.bg} transition-all duration-500 hover:border-white/15`}
            >
              {/* Status indicator dot */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/50 text-xs font-medium uppercase tracking-wide">
                  {meta?.label || key}
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: status.color }}
                  />
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: status.color }}
                  >
                    {status.label}
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-white font-mono tabular-nums">
                  {formatted}
                </span>
                <span className="text-xs text-white/30">{unit}</span>
              </div>

              {/* Bottom accent bar */}
              <div
                className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full opacity-50"
                style={{ backgroundColor: status.color }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
