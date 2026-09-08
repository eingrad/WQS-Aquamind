import { useEffect, useState } from "react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet/dist/leaflet.css";
import DeviceInfoPanel from "../../components/widgets/DeviceInfoPanel";
import FlyToDevice from "../../components/widgets/FlyToDevice";
import ResetMapView from "../../components/map/ResetMapView";
import NorthIndicator from "../../components/map/NorthIndicator";
import MapControls from "../../components/map/MapControls";
import { getDevices } from "../../services/device.service";

const DEFAULT_VIEW = {
  lat: 3.004547195618763,
  lng: 101.70881563208111,
  zoom: 12,
};

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

function ResizeFixer() {
  const map = useMap();
  useEffect(() => {
    // Fix the initial size once the flex layout has settled.
    const raf = requestAnimationFrame(() => map.invalidateSize());

    // Keep Leaflet's cached viewport size in sync with the actual container.
    // Without this, a stale size makes Leaflet load tiles for only part of
    // the view, so zooming/panning shows gray "not loaded" tiles. This covers
    // window resizes and the DeviceInfoPanel opening/closing (which shrinks
    // the map's width).
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

// MapContainer's center/zoom props are only applied on mount. The map mounts
// before devices load, so this recenters the camera once the real device
// coordinates arrive (and whenever they change).
function InitialViewSetter({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
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

  const initialView =
    devices.length > 0
      ? { lat: devices[0].lat, lng: devices[0].lng, zoom: 12 }
      : DEFAULT_VIEW;

  const toggleMapType = () => {
    setMapType((prev) => (prev === "osm" ? "sat" : "osm"));
  };

  useEffect(() => {
    if (resetView) {
      const timeout = setTimeout(() => setResetView(false), 1600);
      return () => clearTimeout(timeout);
    }
  }, [resetView]);

  return (
    <div className="relative flex flex-col lg:flex-row bg-[#ffffff] min-h-screen text-slate-800 w-full overflow-x-hidden">
      <Sidebar active="Overview" isOpen={sidebarOpen} onToggle={setSidebarOpen} />

      <div className="flex flex-col flex-1">
        <Topbar
          title="Overview"
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <MapControls
          mapType={mapType}
          onToggleMapType={toggleMapType}
          devices={devices}
        />

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
              <InitialViewSetter
                lat={initialView.lat}
                lng={initialView.lng}
                zoom={initialView.zoom}
              />
              <NorthIndicator />

              {mapType === "osm" ? (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                      click: () => setSelectedDevice(device),
                    }}
                  />
                </div>
              ))}

              {selectedDevice ? (
                <FlyToDevice
                  lat={selectedDevice.lat}
                  lng={selectedDevice.lng}
                />
              ) : (
                resetView && (
                  <ResetMapView
                    lat={initialView.lat}
                    lng={initialView.lng}
                    zoom={initialView.zoom}
                  />
                )
              )}
            </MapContainer>
          </div>

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
