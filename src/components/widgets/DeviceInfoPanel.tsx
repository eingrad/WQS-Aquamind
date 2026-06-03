import { useEffect, useState } from "react";
import DeviceImage from "../../assets/aquamind-logo.png";
import { getDeviceById } from "../../services/device.service";
import { getTimeSeriesData } from "../../services/telemetry.service";
import { useUnits } from "../../context/UnitContext";
import { PARAMETERS } from "../../data/constants";

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

// Gases (incl. BTEX) display 4 decimals; met parameters use 2.
const GAS_KEYS = new Set([
  "so2",
  "h2s",
  "no2",
  "benzene",
  "toluene",
  "ethylbenzene",
  "xylenes",
]);

// Format parameter value with fallback
function formatValue(
  val: string | number | null | undefined,
  unit: string,
  param?: string,
): string {
  if (val === null || val === undefined || val === "") return "–";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "–";
  const decimals = param && GAS_KEYS.has(param) ? 4 : 2;
  return `${num.toFixed(decimals)} ${unit}`;
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
        // Water quality parameters (keys match constants.ts / backend <key>_avg fields)
        const paramList = PARAMETERS.map((p) => p.key).join(",");

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
      className="fixed right-0 top-0 h-screen w-full sm:w-[300px] md:w-[320px] xl:w-[350px] bg-[#ffffff] border border-slate-200 z-[999] overflow-y-auto"
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="p-4">
        {/* Header with Close Button */}
        <div className="flex justify-between items-center mb-5 mt-16">
          <div className="font-bold text-lg">Device Information</div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-600 transition text-xl font-semibold"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <img
          src={DeviceImage}
          alt="AquaMind"
          className="w-75 h-65 object-contain rounded-xl mb-4"
        />

        {loading ? (
          <div className="text-sm text-slate-500 animate-pulse space-y-3">
            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
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

            <div className="mt-4 bg-[#e2e8f0] p-3 rounded-md w-full max-w-xs">
              <h3 className="text-sm font-semibold text-blue-600 mb-1">
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
                  {PARAMETERS.map((p) => (
                    <div key={p.key} className="flex justify-between">
                      <span>{p.label}</span>
                      <span>
                        {formatValue(
                          convert(latestReading[`${p.key}_avg`], p.key),
                          getUnit(p.key),
                          p.key,
                        )}
                      </span>
                    </div>
                  ))}
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
