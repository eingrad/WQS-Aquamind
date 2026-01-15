import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function FlyToDevice({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 18, { duration: 1.5 });
    }
  }, [lat, lng, map]);

  return null;
}
