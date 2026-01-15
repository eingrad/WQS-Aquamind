export default function ValidationTableHeader() {
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
          <div className="text-xs font-normal text-gray-400">μg/m³</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>
            H<sub>2</sub>S
          </div>
          <div className="text-xs font-normal text-gray-400">ppm</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>
            NO<sub>2</sub>
          </div>
          <div className="text-xs font-normal text-gray-400">ppm</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>BTEX</div>
          <div className="text-xs font-normal text-gray-400">ppm</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>Wind Speed</div>
          <div className="text-xs font-normal text-gray-400">m/s</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>Wind Direction</div>
          <div className="text-xs font-normal text-gray-400">degree</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>Temperature</div>
          <div className="text-xs font-normal text-gray-400">°C</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>Humidity</div>
          <div className="text-xs font-normal text-gray-400">%</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>Pressure</div>
          <div className="text-xs font-normal text-gray-400">hPa</div>
        </th>
        <th className="px-4 py-3 text-center font-semibold border-r border-white/5 min-w-[120px]">
          <div>Rain</div>
          <div className="text-xs font-normal text-gray-400">mm</div>
        </th>
        <th className="w-[10%] px-4 py-3 text-center font-semibold">
          <div>Radiation</div>
          <div className="text-xs font-normal text-gray-400">W/m²</div>
        </th>
      </tr>
    </thead>
  );
}
