import { useEffect, useState } from "react";
import { PARAMETERS } from "../../data/constants";
import { formatPollutantValue } from "../../utils/numberFormat";

interface RealTimeParametersProps {
  deviceId: string;
}

export default function RealTimeParameters({
  deviceId,
}: RealTimeParametersProps) {
  const [liveData, setLiveData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;

    // Fetch live parameter data every 10 seconds
    const fetchLiveData = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockData: Record<string, number> = {
          so2: Math.random() * 50,
          h2s: Math.random() * 10,
          no2: Math.random() * 30,
          btex: Math.random() * 20,
          solar: Math.random() * 800 + 200,
          temperature: Math.random() * 10 + 25,
          humidity: Math.random() * 30 + 50,
          pressure: Math.random() * 20 + 1000,
          rain: Math.random() * 5,
          windSpeed: Math.random() * 10,
          windDirection: Math.random() * 360,
        };

        setLiveData(mockData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch live data:", error);
        setLoading(false);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [deviceId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Loading live data...
      </div>
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
            const value = liveData[param.key] ?? 0;
            const formattedValue = formatPollutantValue(value, param.key);

            // Calculate bar width based on parameter range
            let maxValue = 100;
            if (param.key === "solar") maxValue = 1000;
            if (param.key === "temperature") maxValue = 50;
            if (param.key === "pressure") maxValue = 1050;
            if (param.key === "windDirection") maxValue = 360;

            const percentage = Math.min((value / maxValue) * 100, 100);

            return (
              <div key={param.key} className="space-y-1">
                {/* Parameter label and value */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300 font-medium">
                    {param.label}
                  </span>
                  <span className="text-white font-mono">
                    {formattedValue}{" "}
                    <span className="text-gray-400 text-xs">{param.unit}</span>
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
