import { useUnits } from "../../context/UnitContext";

export default function ValidationTableHeader() {
  const { getUnit } = useUnits();

  return (
    <thead className="bg-[#1a2a2a] sticky top-0 z-10">
      <tr>
        <th className="px-4 py-3 text-left font-semibold border-r border-white/5 min-w-[180px]">
          Date & Time
        </th>
        <th className="px-4 py-3 text-left font-semibold border-r border-white/5 min-w-[140px]">
          Location
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>
            SO<sub>2</sub>
          </div>
          <div className="text-xs font-normal text-gray-400">{getUnit("so2")}</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>
            H<sub>2</sub>S
          </div>
          <div className="text-xs font-normal text-gray-400">{getUnit("h2s")}</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>
            NO<sub>2</sub>
          </div>
          <div className="text-xs font-normal text-gray-400">{getUnit("no2")}</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>BTEX</div>
          <div className="text-xs font-normal text-gray-400">{getUnit("btex")}</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>Wind Speed</div>
          <div className="text-xs font-normal text-gray-400">{getUnit("windSpeed")}</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>Wind Direction</div>
          <div className="text-xs font-normal text-gray-400">{getUnit("windDirection")}</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>Temperature</div>
          <div className="text-xs font-normal text-gray-400">{getUnit("temperature")}</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>Humidity</div>
          <div className="text-xs font-normal text-gray-400">{getUnit("humidity")}</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>Pressure</div>
          <div className="text-xs font-normal text-gray-400">{getUnit("pressure")}</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>Rain</div>
          <div className="text-xs font-normal text-gray-400">{getUnit("rain")}</div>
        </th>
        <th className="w-[10%] px-4 py-3 text-center font-semibold">
          <div>Radiation</div>
          <div className="text-xs font-normal text-gray-400">{getUnit("solar")}</div>
        </th>
      </tr>
    </thead>
  );
}
