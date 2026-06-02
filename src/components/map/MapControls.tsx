interface MapControlsProps {
  mapType: "osm" | "sat";
  onToggleMapType: () => void;
  devices: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>;
}

export default function MapControls({
  mapType,
  onToggleMapType,
  devices,
}: MapControlsProps) {
  return (
    <div className="bg-[#ffffff] px-4 sm:px-6 py-4 border-slate-200 border-b flex items-center justify-between flex-wrap gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <button
          onClick={onToggleMapType}
          className="sm:ml-auto px-4 py-2.5 rounded-lg text-sm bg-gradient-to-br from-[#e2e8f0] to-[#e2e8f0] border border-slate-200 hover:border-blue-500/40 hover:bg-[#e2e8f0] transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
        >
          {mapType === "osm" ? "Switch to Satellite" : "Switch to Map View"}
        </button>
        <div className="relative group">
          <select
            id="device-select"
            className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#ffffff] to-[#ffffff] border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
          >
            <option value="" className="bg-[#e2e8f0] text-slate-800">
              Select Device
            </option>
            {devices.map((d) => (
              <option
                key={d.id}
                value={d.id}
                className="bg-[#e2e8f0] text-slate-800"
              >
                {d.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-blue-600 group-hover:text-blue-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        <label
          htmlFor="device-select"
          className="text-sm text-slate-500 sm:ml-2"
        >
          Select a device to view parameter details
        </label>
      </div>
    </div>
  );
}
