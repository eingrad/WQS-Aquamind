import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function FlyToDevice({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      // Zoom to the marker first, then offset center to account for the DeviceInfoPanel (280px wide)
      const targetZoom = 16;
      const panelWidth = 350;

      // Fly to the marker location
      map.flyTo([lat, lng], targetZoom, { duration: 1.5 });

      // After fly animation completes, offset center to the left by half the panel width
      setTimeout(() => {
        const targetPoint = map.latLngToContainerPoint([lat, lng]);
        const offsetPoint = L.point(
          targetPoint.x + panelWidth / 2,
          targetPoint.y,
        );
        const offsetLatLng = map.containerPointToLatLng(offsetPoint);
        map.panTo(offsetLatLng, { animate: true, duration: 0.5 });
      }, 1600);
    }
  }, [lat, lng, map]);

  return null;
}
