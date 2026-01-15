import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import WindRoseChart from "../charts/WindRoseChart";
import { X } from "lucide-react";

interface WindRoseOverlayProps {
  lat: number;
  lng: number;
  onClose: () => void;
}

export default function WindRoseOverlay({
  lat,
  lng,
  onClose,
}: WindRoseOverlayProps) {
  const map = useMap();
  const [position, setPosition] = useState({ x: 0, y: 0 });

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

        <div className="w-full h-full opacity-70">
          <WindRoseChart labelColor="#000000ff" />
        </div>
      </div>
    </div>
  );
}
