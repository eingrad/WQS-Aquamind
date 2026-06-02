import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import WindRoseChart from "../charts/WindRoseChart";
import { X, Wind } from "lucide-react";
import { getWindRoseData } from "../../services/liveData.service";

interface WindRoseOverlayProps {
  lat: number;
  lng: number;
  deviceId: string;
  onClose: () => void;
}

export default function WindRoseOverlay({
  lat,
  lng,
  deviceId,
  onClose,
}: WindRoseOverlayProps) {
  const map = useMap();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [windData, setWindData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updatePosition = () => {
      const point = map.latLngToContainerPoint([lat, lng]);
      setPosition({ x: point.x, y: point.y });
    };

    // Update position initially
    updatePosition();

    // Update position when map moves or zooms
    map.on("move", updatePosition);
    map.on("zoom", updatePosition);

    return () => {
      map.off("move", updatePosition);
      map.off("zoom", updatePosition);
    };
  }, [map, lat, lng]);

  // Fetch wind rose data from Redis
  useEffect(() => {
    if (!deviceId) return;

    const fetchData = async () => {
      try {
        const data = await getWindRoseData(deviceId);
        setWindData(data);
      } catch {
        // No live data available — chart will show empty state
        setWindData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [deviceId]);

  // Calculate offset to center the wind rose chart (not the entire container) at marker
  // Title bar is ~48px (py-2 = 8px top + 8px bottom + content ~32px)
  // Chart height is 480px, so its center is at 240px
  // Total offset from top = 48px (title) + 8px (mb-2) + 240px (center of chart) = 296px
  // We want this to align with marker, so offset = -296px + 50% of container height (275px) = -21px
  const chartCenterOffset = 48 + 8 + 240; // title bar + margin + half of chart height
  const containerHalfHeight = 275; // 550px / 2
  const verticalOffset = chartCenterOffset - containerHalfHeight; // Should be ~21px

  return (
    <div
      className="absolute z-[900] pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(-44.5%, calc(-48% - ${verticalOffset}px))`,
      }}
    >
      <div className="rounded-lg w-[500px] h-[550px] relative">
        {/* Modern floating close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-110"
          aria-label="Close Wind Analysis"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Show a visible card when no data, or transparent chart when data exists */}
        {!loading && !windData?.directions ? (
          <div className="w-full h-full flex items-center justify-center rounded-xl bg-[#ffffff]/95 backdrop-blur-md border border-blue-500/30 shadow-2xl">
            <div className="text-center px-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Wind className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Wind Data</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                The device may be offline or no wind<br />data has been recorded yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full opacity-70">
            <WindRoseChart data={windData} loading={loading} labelColor="#000000ff" />
          </div>
        )}
      </div>
    </div>
  );
}
