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
  stationName = "PETRONAS Air Quality Monitoring Station",
  location = "Pengerang",
  latitude = 1.366694,
  longitude = 104.108306,
}: StationMapProps) {
  return (
    <div className="h-full w-full flex flex-col">
      {/* Station Info Header */}
      <div className="flex items-center gap-2 mb-3 px-2">
        <MapPin className="w-5 h-5 text-teal-400" />
        <div>
          <div className="text-sm font-medium text-gray-200">{stationName}</div>
          <div className="text-xs text-gray-400">
            {location} ({formatCoordinate(latitude)}°N,{" "}
            {formatCoordinate(longitude)}°E)
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 rounded-lg overflow-hidden border border-gray-700/50">
        <MapContainer
          center={[latitude, longitude]}
          zoom={13}
          scrollWheelZoom={true}
          zoomControl={true}
          dragging={true}
          className="w-full h-full"
          attributionControl={false}
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
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-gray-400">Region</div>
          <div className="text-gray-200 font-medium">Johor, Malaysia</div>
        </div>
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-gray-400">Status</div>
          <div className="text-green-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Active
          </div>
        </div>
      </div>
    </div>
  );
}
