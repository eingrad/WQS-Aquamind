import { useMap } from "react-leaflet";
import { useEffect } from "react";

export default function ResetMapView({
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
    map.flyTo([lat, lng], zoom, {
      duration: 1.5,
    });
  }, [lat, lng, zoom, map]);

  return null;
}
