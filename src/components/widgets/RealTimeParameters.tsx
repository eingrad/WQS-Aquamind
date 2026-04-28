import { useEffect, useState } from "react";
import { PARAMETERS } from "../../data/constants";
import { formatPollutantValue } from "../../utils/numberFormat";
import { useUnits } from "../../context/UnitContext";
import {
  getRealTimeParams,
  type RealtimeReading,
} from "../../services/liveData.service";
import { getLatestReadings } from "../../services/telemetry.service";
import EmptyState from "../common/EmptyState";

interface RealTimeParametersProps {
  deviceId: string;
}

/**
 * Format an ISO timestamp as a relative "Xs ago" / "Xm ago" string,
 * relative to the current time at render. Returns "" when the value
 * is missing / unparseable.
 */
function formatAgo(at: string | undefined, now: number): string {
  if (!at) return "";
  const t = Date.parse(at);
  if (isNaN(t)) return "";
  const ageMs = Math.max(0, now - t);
  const ageS = Math.floor(ageMs / 1000);
  if (ageS < 60) return `${ageS}s ago`;
  const ageM = Math.floor(ageS / 60);
  if (ageM < 60) return `${ageM}m ago`;
  const ageH = Math.floor(ageM / 60);
  return `${ageH}h ago`;
}

/**
 * Color the "Xs ago" label by staleness:
 * - fresh (<30s) → muted gray (looks normal)
 * - aging (30s–2min) → yellow (something may be off)
 * - stale (>2min) → red (parameter is not being updated)
 */
function freshnessColor(at: string | undefined, now: number): string {
  if (!at) return "text-gray-500";
  const ageMs = now - Date.parse(at);
  if (isNaN(ageMs)) return "text-gray-500";
  if (ageMs < 30_000) return "text-gray-500";
  if (ageMs < 120_000) return "text-yellow-400";
  return "text-red-400";
}

export default function RealTimeParameters({
  deviceId,
}: RealTimeParametersProps) {
  const [liveData, setLiveData] = useState<Record<string, RealtimeReading>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const { convert, getUnit } = useUnits();

  useEffect(() => {
    if (!deviceId) return;

    const fetchLiveData = async () => {
      try {
        // Try live data from Redis (pushed by MQTT subscriber).
        // The service layer already synthesizes a virtual `xylene` reading
        // from mp_xylene + o_xylene, so this widget just consumes it.
        const data = await getRealTimeParams(deviceId);
        setLiveData(data.readings);
        setLoading(false);
      } catch {
        // Fallback: get latest reading from database — single shared timestamp
        try {
          const readings = await getLatestReadings(deviceId, 1);
          if (readings.length > 0) {
            const latest = readings[0];
            const at = latest.observedAt ?? new Date().toISOString();
            const mapped: Record<string, RealtimeReading> = {};
            const set = (
              key: string,
              raw: string | number | null | undefined,
            ) => {
              if (raw === null || raw === undefined || raw === "") return;
              const num = typeof raw === "string" ? parseFloat(raw) : raw;
              if (!isNaN(num)) mapped[key] = { value: num, at };
            };
            set("so2", latest.so2Value);
            set("h2s", latest.h2sValue);
            set("no2", latest.no2Value);
            // BTEX components (Synspec GC955)
            set("benzene", latest.benzeneValue);
            set("toluene", latest.tolueneValue);
            set("ethylbenzene", latest.ethylbenzeneValue);
            set("mp_xylene", latest.mpXyleneValue);
            set("o_xylene", latest.oXyleneValue);
            set("temperature", latest.tempValue);
            set("humidity", latest.humidityValue);
            set("windSpeed", latest.wsValue);
            set("windDirection", latest.wdValue);
            set("solar", latest.solarValue);
            set("pressure", latest.pressureValue);
            set("rain", latest.rainValue);
            setLiveData(mapped);
          }
        } catch (dbErr) {
          console.error("Failed to fetch fallback data:", dbErr);
        }
        setLoading(false);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [deviceId]);

  // Tick every second so the "Xs ago" labels update without re-fetching.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-teal-400">Loading...</div>
      </div>
    );
  }

  if (Object.keys(liveData).length === 0) {
    return (
      <EmptyState
        compact
        title="No Live Data"
        message="The device may be offline or no data has been recorded yet."
      />
    );
  }

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #14b8a6;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0d9488;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #474747ff #1f2937;
        }
      `}</style>
      <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-2">
          {PARAMETERS.map((param) => {
            const entry = liveData[param.key];
            const rawValue = entry?.value ?? 0;
            const at = entry?.at;
            const convertedValue = convert(rawValue, param.key) ?? rawValue;
            const formattedValue = formatPollutantValue(
              convertedValue,
              param.key,
            );
            const displayUnit = getUnit(param.key);
            const ago = formatAgo(at, now);
            const agoColor = freshnessColor(at, now);

            // Calculate bar width based on parameter range
            let maxValue = 100;
            if (param.key === "solar") maxValue = 1000;
            if (param.key === "temperature") maxValue = 50;
            if (param.key === "pressure") maxValue = 1050;
            if (param.key === "windDirection") maxValue = 360;

            const percentage = Math.min((rawValue / maxValue) * 100, 100);

            return (
              <div key={param.key} className="space-y-1">
                {/* Parameter label and value */}
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-baseline gap-2">
                    <span className="text-gray-300 font-medium">
                      {param.label}
                    </span>
                    {ago && entry && (
                      <span className={`text-[10px] ${agoColor}`} title={at}>
                        {ago}
                      </span>
                    )}
                  </span>
                  <span className="text-white font-mono">
                    {entry ? formattedValue : "–"}{" "}
                    <span className="text-gray-400 text-xs">{displayUnit}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
