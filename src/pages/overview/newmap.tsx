// WindDirectionMap.jsx
import { useEffect, useRef } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, LineString } from "geojson";

export default function WindDirectionMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapLibreMap | null>(null);

  const sensor = {
    id: "sensor-001",
    lat: 4.2501,
    lng: 100.7033,
    so2: 72,
    wind_dir: 320,
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [sensor.lng, sensor.lat],
      zoom: 16,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    new maplibregl.Marker({ color: "orange" })
      .setLngLat([sensor.lng, sensor.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(`
          <strong>Sensor ID:</strong> ${sensor.id}<br/>
          <strong>SO₂:</strong> ${sensor.so2} ppb<br/>
          <strong>Wind:</strong> ${sensor.wind_dir}°
        `)
      )
      .addTo(map.current);

    const size = 300; // meters
    const angleRad = ((sensor.wind_dir + 180) * Math.PI) / 180; // fixed: wind comes from direction
    const arrowLng = sensor.lng + (Math.sin(angleRad) * size) / 111320;
    const arrowLat = sensor.lat + (Math.cos(angleRad) * size) / 110540;

    const geojson: FeatureCollection<LineString> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [sensor.lng, sensor.lat],
              [arrowLng, arrowLat],
            ],
          },
        },
      ],
    };

    map.current.on("load", () => {
      map.current!.addSource("wind-arrow", {
        type: "geojson",
        data: geojson,
      });

      map.current!.addLayer({
        id: "wind-arrow-layer",
        type: "line",
        source: "wind-arrow",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#00ffff",
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });
    });
  }, []);

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg border border-gray-700">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
