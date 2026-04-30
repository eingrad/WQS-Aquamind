import { useEffect, useState } from "react";
import DeviceImage from "../../assets/pengerang.jpg";
import { getDeviceById } from "../../services/device.service";
import { getTimeSeriesData } from "../../services/telemetry.service";
import { useUnits } from "../../context/UnitContext";

// Convert decimal degrees to DMS format
function toDMS(decimal: number, isLat: boolean): string {
  const abs = Math.abs(decimal);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(1);
  const dir = isLat ? (decimal >= 0 ? "N" : "S") : decimal >= 0 ? "E" : "W";
  return `${deg}°${min}'${sec}"${dir}`;
}

// Format parameter value with fallback
function formatValue(
  val: string | number | null | undefined,
  unit: string,
): string {
  if (val === null || val === undefined || val === "") return "–";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "–";
  return `${num.toFixed(2)} ${unit}`;
}

export default function DeviceInfoPanel({
  device,
  onClose,
}: {
  device: { id: string; name: string; lat: number; lng: number };
  onClose: () => void;
}) {
  const [deviceDetails, setDeviceDetails] = useState<any>(null);
  const [latestReading, setLatestReading] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { convert, getUnit } = useUnits();

  useEffect(() => {
    if (!device?.id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch device details
        const details = await getDeviceById(device.id);
        setDeviceDetails(details);

        const now = new Date();
        const paramList =
          "so2,h2s,no2,temperature,humidity,windSpeed,windDirection,solar,pressure,rain";

        // Strategy 1: Try fetching last 3 days with 1m interval (high res, fast for short range)
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        let tsData = await getTimeSeriesData({
          deviceId: device.id,
          startDate: threeDaysAgo.toISOString(),
          endDate: now.toISOString(),
          interval: "1m",
          parameters: paramList,
        });

        let timeSeries = tsData?.timeSeries || tsData || [];

        // Strategy 2: If no data, try last 30 days with 1h interval (low res, fast aggregation)
        if (timeSeries.length === 0) {
          const thirtyDaysAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000,
          );
          tsData = await getTimeSeriesData({
            deviceId: device.id,
            startDate: thirtyDaysAgo.toISOString(),
            endDate: now.toISOString(),
            interval: "1h",
            parameters: paramList,
          });
          timeSeries = tsData?.timeSeries || tsData || [];
        }

        if (timeSeries.length > 0) {
          setLatestReading(timeSeries[0]);
        } else {
          setLatestReading(null);
        }
      } catch (error) {
        console.error("Error fetching device data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [device?.id]);

  if (!device) return null;

  const location = deviceDetails?.location || "–";
  const status = deviceDetails?.status || "unknown";
  const lat = deviceDetails?.latitude
    ? parseFloat(deviceDetails.latitude)
    : device.lat;
  const lng = deviceDetails?.longitude
    ? parseFloat(deviceDetails.longitude)
    : device.lng;
  const deviceCode = deviceDetails?.deviceCode || device.id;

  return (
    <div
      className="fixed right-0 top-0 h-screen w-full sm:w-[300px] md:w-[320px] xl:w-[350px] bg-[#111a1a] border border-white/5 z-[999] overflow-y-auto"
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="p-4">
        {/* Header with Close Button */}
        <div className="flex justify-between items-center mb-5 mt-16">
          <div className="font-bold text-lg">Device Information</div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-400 transition text-xl font-semibold"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <img
          src={DeviceImage}
          alt="Device Preview"
          className="w-75 h-65 rounded-xl mb-4"
        />

        {loading ? (
          <div className="text-sm text-gray-400 animate-pulse space-y-3">
            <div className="h-4 bg-white/5 rounded w-3/4"></div>
            <div className="h-4 bg-white/5 rounded w-1/2"></div>
            <div className="h-4 bg-white/5 rounded w-2/3"></div>
          </div>
        ) : (
          <>
            <div className="space-y-4 text-sm mb-5">
              <div className="flex justify-between flex-wrap">
                <b>Device ID</b>
                <span className="text-right">{deviceCode}</span>
              </div>
              <div className="flex justify-between flex-wrap">
                <b>Location</b>
                <span className="text-right">{location}</span>
              </div>
              <div className="flex justify-between flex-wrap">
                <b>Device Status</b>
                <span
                  className={`text-right ${
                    status === "active"
                      ? "text-green-500"
                      : status === "maintenance"
                        ? "text-yellow-500"
                        : "text-red-500"
                  }`}
                >
                  {status === "active"
                    ? "Online"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between flex-wrap">
                <b>Latitude</b>
                <span className="text-right">{toDMS(lat, true)}</span>
              </div>
              <div className="flex justify-between flex-wrap">
                <b>Longitude</b>
                <span className="text-right">{toDMS(lng, false)}</span>
              </div>
            </div>

            <div className="mt-4 bg-[#1a2a2a] p-3 rounded-md w-full max-w-xs">
              <h3 className="text-sm font-semibold text-teal-400 mb-1">
                Parameters
              </h3>
              {latestReading?.bucket && (
                <p className="text-xs text-gray-500 mb-5">
                  Last updated:{" "}
                  {new Date(latestReading.bucket).toLocaleString("en-MY", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Kuala_Lumpur",
                  })}
                </p>
              )}
              {latestReading ? (
                <div className="text-sm space-y-5">
                  <div className="flex justify-between">
                    <span>SO₂</span>
                    <span>
                      {formatValue(
                        convert(latestReading.so2_avg, "so2"),
                        getUnit("so2"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>H₂S</span>
                    <span>
                      {formatValue(
                        convert(latestReading.h2s_avg, "h2s"),
                        getUnit("h2s"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>NO₂</span>
                    <span>
                      {formatValue(
                        convert(latestReading.no2_avg, "no2"),
                        getUnit("no2"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Benzene</span>
                    <span>
                      {formatValue(
                        convert(latestReading.benzene_avg, "benzene"),
                        getUnit("benzene"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Toluene</span>
                    <span>
                      {formatValue(
                        convert(latestReading.toluene_avg, "toluene"),
                        getUnit("toluene"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ethylbenzene</span>
                    <span>
                      {formatValue(
                        convert(latestReading.ethylbenzene_avg, "ethylbenzene"),
                        getUnit("ethylbenzene"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Xylenes</span>
                    <span>
                      {formatValue(
                        convert(latestReading.xylenes_avg, "xylenes"),
                        getUnit("xylenes"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind Speed</span>
                    <span>
                      {formatValue(
                        convert(latestReading.windspeed_avg, "windSpeed"),
                        getUnit("windSpeed"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind Direction</span>
                    <span>
                      {formatValue(
                        convert(
                          latestReading.winddirection_avg,
                          "windDirection",
                        ),
                        getUnit("windDirection"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rain</span>
                    <span>
                      {formatValue(
                        convert(latestReading.rain_avg, "rain"),
                        getUnit("rain"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pressure</span>
                    <span>
                      {formatValue(
                        convert(latestReading.pressure_avg, "pressure"),
                        getUnit("pressure"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Humidity</span>
                    <span>
                      {formatValue(
                        convert(latestReading.humidity_avg, "humidity"),
                        getUnit("humidity"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperature</span>
                    <span>
                      {formatValue(
                        convert(latestReading.temperature_avg, "temperature"),
                        getUnit("temperature"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Solar Radiation</span>
                    <span>
                      {formatValue(
                        convert(latestReading.solar_avg, "solar"),
                        getUnit("solar"),
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No readings available
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
