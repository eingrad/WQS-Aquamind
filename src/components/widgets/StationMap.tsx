import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { formatCoordinate } from "../../utils/numberFormat";

interface StationMapProps {
  stationName?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}

// Green marker icon
const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function StationMap({
  stationName = "AquaMind Water Quality Monitoring Station",
  location = "Pengerang",
  latitude = 1.366694,
  longitude = 104.108306,
  status = "active",
}: StationMapProps) {
  const isActive = status.toLowerCase() === "active";
  const statusColor = isActive ? "text-green-600" : "text-red-600";
  const statusBg = isActive ? "bg-green-400" : "bg-red-400";

  return (
    <div className="h-full w-full flex flex-col">
      {/* Station Info Header */}
      <div className="flex items-center gap-2 mb-3 px-2">
        <MapPin className="w-5 h-5 text-blue-600" />
        <div>
          <div className="text-sm font-medium text-slate-700">{stationName}</div>
          <div className="text-xs text-slate-500">
            {location}, Malaysia ({formatCoordinate(latitude)}°N,{" "}
            {formatCoordinate(longitude)}°E)
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 rounded-lg overflow-hidden border border-gray-700/50 relative z-0">
        <MapContainer
          center={[latitude, longitude]}
          zoom={13}
          scrollWheelZoom={true}
          zoomControl={true}
          dragging={true}
          className="w-full h-full"
          attributionControl={false}
          key={`${latitude}-${longitude}`} // Force re-render when coords change
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

          {/* Teal circle around station */}
          <Circle
            center={[latitude, longitude]}
            radius={85}
            pathOptions={{
              fillColor: "teal",
              fillOpacity: 0.15,
              stroke: true,
              color: "teal",
              weight: 0.4,
            }}
          />

          {/* Station marker */}
          <Marker position={[latitude, longitude]} icon={greenIcon} />
        </MapContainer>
      </div>

      {/* Location Details */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-100 rounded p-2">
          <div className="text-slate-500">Region</div>
          <div className="text-slate-700 font-medium">{location}, Malaysia</div>
        </div>
        <div className="bg-slate-100 rounded p-2">
          <div className="text-slate-500">Status</div>
          <div className={`font-medium flex items-center gap-1 ${statusColor}`}>
            <span
              className={`w-2 h-2 rounded-full ${statusBg} ${
                isActive ? "animate-pulse" : ""
              }`}
            />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
