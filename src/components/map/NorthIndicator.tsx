import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { ArrowBigUp } from "lucide-react";
import ReactDOM from "react-dom/client";

export default function NorthIndicator() {
  const map = useMap();

  useEffect(() => {
    // Create a container for React to render into
    const container = L.DomUtil.create("div");

    // Render Tailwind + Lucide icon into Leaflet control
    const root = ReactDOM.createRoot(container);
    root.render(
      <div className="w-10 h-10 bg-black/70 rounded-lg flex flex-col items-center justify-center shadow-md border border-slate-200 select-none">
        <ArrowBigUp className="w-5 h-5 text-red-500" />
        <span className="text-xs text-red-500 font-semibold -mt-0.5">N</span>
      </div>
    );

    const NorthCtrl = L.Control.extend({
      onAdd: () => container,
      onRemove: () => {},
    });

    // Create instance
    const northCtrl = new NorthCtrl({ position: "bottomleft" });

    // Add to map
    map.addControl(northCtrl);

    return () => {
      map.removeControl(northCtrl);
    };
  }, [map]);

  return null;
}
