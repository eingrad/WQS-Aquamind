import { useEffect, useState } from "react";
import { PARAMETERS } from "../../data/constants";
import { formatPollutantValue } from "../../utils/numberFormat";
import { useUnits } from "../../context/UnitContext";
import { getRealTimeParams } from "../../services/liveData.service";
import { getLatestReadings } from "../../services/telemetry.service";
import EmptyState from "../common/EmptyState";

interface RealTimeParametersProps {
  deviceId: string;
}

export default function RealTimeParameters({
  deviceId,
}: RealTimeParametersProps) {
  const [liveData, setLiveData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { convert, getUnit } = useUnits();

  useEffect(() => {
    if (!deviceId) return;

    const fetchLiveData = async () => {
      try {
        // Try live data from Redis (pushed by MQTT subscriber)
        const data = await getRealTimeParams(deviceId);
        setLiveData(data.readings);
        setLoading(false);
      } catch {
        // Fallback: get latest reading from database
        try {
          const readings = await getLatestReadings(deviceId, 1);
          if (readings.length > 0) {
            const latest = readings[0];
            const mapped: Record<string, number> = {};
            if (latest.so2Value) mapped.so2 = parseFloat(latest.so2Value);
            if (latest.h2sValue) mapped.h2s = parseFloat(latest.h2sValue);
            if (latest.no2Value) mapped.no2 = parseFloat(latest.no2Value);
            if (latest.btexValue) mapped.btex = parseFloat(latest.btexValue);
            if (latest.tempValue) mapped.temperature = parseFloat(latest.tempValue);
            if (latest.humidityValue) mapped.humidity = parseFloat(latest.humidityValue);
            if (latest.wsValue) mapped.windSpeed = parseFloat(latest.wsValue);
            if (latest.wdValue) mapped.windDirection = parseFloat(latest.wdValue);
            if (latest.solarValue) mapped.solar = parseFloat(latest.solarValue);
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
            const rawValue = liveData[param.key] ?? 0;
            const convertedValue = convert(rawValue, param.key) ?? rawValue;
            const formattedValue = formatPollutantValue(convertedValue, param.key);
            const displayUnit = getUnit(param.key);

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
                  <span className="text-gray-300 font-medium">
                    {param.label}
                  </span>
                  <span className="text-white font-mono">
                    {formattedValue}{" "}
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
