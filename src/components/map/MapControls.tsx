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
    <div className="bg-[#0f1717] px-4 sm:px-6 py-4 border-white/5 border-b flex items-center justify-between flex-wrap gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <button
          onClick={onToggleMapType}
          className="sm:ml-auto px-4 py-2.5 rounded-lg text-sm bg-gradient-to-br from-[#1a2a2a] to-[#1a2a2a] border border-white/10 hover:border-teal-500/40 hover:bg-[#253838] transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10"
        >
          {mapType === "osm" ? "Switch to Satellite" : "Switch to Map View"}
        </button>
        <div className="relative group">
          <select
            id="device-select"
            className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#0d1717] to-[#0d1717] border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none"
          >
            <option value="" className="bg-[#1a2a2a] text-white">
              Select Device
            </option>
            {devices.map((d) => (
              <option
                key={d.id}
                value={d.id}
                className="bg-[#1a2a2a] text-white"
              >
                {d.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-teal-400 group-hover:text-teal-300 transition-colors"
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
          className="text-sm text-gray-400 sm:ml-2"
        >
          Select a device to view parameter details
        </label>
      </div>
    </div>
  );
}
