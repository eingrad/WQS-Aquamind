import { useEffect, useState } from "react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import { MapContainer, TileLayer, Marker, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet/dist/leaflet.css";
import DeviceInfoPanel from "../../components/widgets/DeviceInfoPanel";
import FlyToDevice from "../../components/widgets/FlyToDevice";
import ResetMapView from "../../components/map/ResetMapView";
import NorthIndicator from "../../components/map/NorthIndicator";
import WindRoseOverlay from "../../components/map/WindRoseOverlay";
import MapControls from "../../components/map/MapControls";
import { getDevices } from "../../services/device.service";

// Default initial view for the map (Malaysia center as fallback)
const DEFAULT_VIEW = {
  lat: 1.366694,
  lng: 104.108306,
  zoom: 12,
};

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

// Fix Leaflet resize issues
function ResizeFixer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [map]);
  return null;
}

export default function OverviewPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapType, setMapType] = useState<"osm" | "sat">("osm");
  const [devices, setDevices] = useState<
    { id: string; name: string; lat: number; lng: number }[]
  >([]);
  const [selectedDevice, setSelectedDevice] = useState<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [resetView, setResetView] = useState(false);
  const [showWindRose, setShowWindRose] = useState(false);

  // Fetch devices from database
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await getDevices({ status: "active" });
        const mapped = (data.devices || data).map((d: any) => ({
          id: d.id,
          name: d.name,
          lat: d.latitude ? parseFloat(d.latitude) : DEFAULT_VIEW.lat,
          lng: d.longitude ? parseFloat(d.longitude) : DEFAULT_VIEW.lng,
        }));
        setDevices(mapped);
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };
    fetchDevices();
  }, []);

  // Compute initial view from first device or fallback
  const initialView =
    devices.length > 0
      ? { lat: devices[0].lat, lng: devices[0].lng, zoom: 12 }
      : DEFAULT_VIEW;

  const toggleMapType = () => {
    setMapType((prev) => (prev === "osm" ? "sat" : "osm"));
  };

  // Automatically disable resetView after triggering it once
  useEffect(() => {
    if (resetView) {
      const timeout = setTimeout(() => setResetView(false), 1600); // match flyTo duration
      return () => clearTimeout(timeout);
    }
  }, [resetView]);

  return (
    <div className="relative flex flex-col lg:flex-row bg-[#0f1a1a] min-h-screen text-white w-full overflow-x-hidden">
      <Sidebar active="Overview" isOpen={sidebarOpen} onToggle={setSidebarOpen} />

      <div className="flex flex-col flex-1">
        <Topbar
          title="Overview"
          view={"graph"}
          setView={function (_v: "graph" | "table"): void {
            throw new Error("Function not implemented.");
          }}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Header controls */}
        <MapControls
          mapType={mapType}
          onToggleMapType={toggleMapType}
          devices={devices}
        />

        {/* Map and Info Panel */}
        <div className="flex-1 w-full relative z-10 flex">
          <div className="flex-1">
            <MapContainer
              center={[initialView.lat, initialView.lng]}
              zoom={initialView.zoom}
              minZoom={6}
              maxZoom={18}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <ResizeFixer />
              <NorthIndicator />

              {mapType === "osm" ? (
                <TileLayer
                  attribution='&copy; <a href=""></a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
              ) : (
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a> | Source: Esri, Maxar, Earthstar Geographics'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              )}

              {devices.map((device) => (
                <div key={device.id}>
                  <Circle
                    center={[device.lat, device.lng]}
                    radius={85}
                    pathOptions={{
                      fillColor: "teal",
                      fillOpacity: 0.15,
                      stroke: true,
                      color: "teal",
                      weight: 0.4,
                    }}
                  />
                  <Marker
                    position={[device.lat, device.lng]}
                    icon={greenIcon}
                    eventHandlers={{
                      click: () => {
                        setSelectedDevice(device);
                        setShowWindRose(true);
                      },
                    }}
                  />
                </div>
              ))}

              {/* Fly to marker on selection */}
              {selectedDevice ? (
                <>
                  <FlyToDevice
                    lat={selectedDevice.lat}
                    lng={selectedDevice.lng}
                  />
                </>
              ) : (
                resetView && (
                  <ResetMapView
                    lat={initialView.lat}
                    lng={initialView.lng}
                    zoom={initialView.zoom}
                  />
                )
              )}

              {/* Wind Rose Overlay */}
              {showWindRose && selectedDevice && (
                <WindRoseOverlay
                  lat={selectedDevice.lat}
                  lng={selectedDevice.lng}
                  deviceId={selectedDevice.id}
                  onClose={() => setShowWindRose(false)}
                />
              )}
            </MapContainer>
          </div>

          {/* Device Info Panel - outside MapContainer so scroll works */}
          {selectedDevice && (
            <DeviceInfoPanel
              device={selectedDevice}
              onClose={() => {
                setSelectedDevice(null);
                setResetView(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
