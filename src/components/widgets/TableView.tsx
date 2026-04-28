import { useState } from "react";
import Pagination from "./Pagination";
import { formatPollutantValue } from "../../utils/numberFormat";
import { formatDateTime } from "../../utils/dateFormat";
import { useUnits } from "../../context/UnitContext";

interface DataRow {
  t: string;
  so2: number;
  h2s: number;
  no2: number;
  // BTEX components — Synspec GC955 channels 34/35/36/37/38, all in ppb
  benzene: number;
  toluene: number;
  ethylbenzene: number;
  mp_xylene: number;
  o_xylene: number;
  solar: number;
  temperature: number;
  humidity: number;
  pressure: number;
  rain: number;
  windSpeed: number;
  windDir: number;
}

type TableViewProps = {
  data: DataRow[];
  device: string;
  // startDate and endDate are kept for potential future use but not currently used
  // Backend already handles date filtering
  startDate?: string;
  endDate?: string;
  devices: any[];
};

export default function TableView({ data, device, devices }: TableViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const { convert, getUnit } = useUnits();

  // Backend already filters by date range, so use data directly
  const filteredData = data;

  // Calculate pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentData = filteredData.slice(startIndex, endIndex);

  return (
    <>
      <style>{`
        .custom-table-scroll::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }
        .custom-table-scroll::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        .custom-table-scroll::-webkit-scrollbar-thumb {
          background: #14b8a6;
          border-radius: 4px;
        }
        .custom-table-scroll::-webkit-scrollbar-thumb:hover {
          background: #0d9488;
        }
        .custom-table-scroll {
          scrollbar-width: thin;
          scrollbar-color: #474747ff #1f2937;
        }
      `}</style>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="overflow-x-auto overflow-y-auto custom-table-scroll">
          <table className="w-full text-sm">
            <thead className="bg-[#1a2a2a] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold border-r border-[#1a2a2a] min-w-[180px]">
                  Time & Date
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[140px]">
                  Location
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[120px]">
                  <div>SO₂</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("so2")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[120px]">
                  <div>H₂S</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("h2s")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[120px]">
                  <div>NO₂</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("no2")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[120px]">
                  <div>Benzene</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("benzene")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[120px]">
                  <div>Toluene</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("toluene")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[140px]">
                  <div>Ethylbenzene</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("ethylbenzene")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[130px]">
                  <div>m,p-Xylene</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("mp_xylene")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[120px]">
                  <div>o-Xylene</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("o_xylene")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[140px]">
                  <div>Solar Radiation</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("solar")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[120px]">
                  <div>Temperature</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("temperature")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[120px]">
                  <div>Humidity</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("humidity")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[120px]">
                  <div>Pressure</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("pressure")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[120px]">
                  <div>Rain</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("rain")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#1a2a2a] min-w-[120px]">
                  <div>Wind Speed</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("windSpeed")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold min-w-[120px]">
                  <div>Wind Direction</div>
                  <div className="text-xs font-normal text-gray-400">
                    {getUnit("windDirection")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-3 text-left ">
                    {formatDateTime(row.t)}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {devices.find((d) => d.id === device)?.location || "–"}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(convert(row.so2, "so2") ?? 0, "so2")}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(convert(row.h2s, "h2s") ?? 0, "h2s")}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(convert(row.no2, "no2") ?? 0, "no2")}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(
                      convert(row.benzene, "benzene") ?? 0,
                      "benzene",
                    )}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(
                      convert(row.toluene, "toluene") ?? 0,
                      "toluene",
                    )}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(
                      convert(row.ethylbenzene, "ethylbenzene") ?? 0,
                      "ethylbenzene",
                    )}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(
                      convert(row.mp_xylene, "mp_xylene") ?? 0,
                      "mp_xylene",
                    )}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(
                      convert(row.o_xylene, "o_xylene") ?? 0,
                      "o_xylene",
                    )}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(
                      convert(row.solar, "solar") ?? 0,
                      "solar",
                    )}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(
                      convert(row.temperature, "temperature") ?? 0,
                      "temperature",
                    )}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(row.humidity, "humidity")}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(row.pressure, "pressure")}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(row.rain, "rain")}
                  </td>
                  <td className="px-4 py-3 text-center ">
                    {formatPollutantValue(
                      convert(row.windSpeed, "windSpeed") ?? 0,
                      "windSpeed",
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatPollutantValue(row.windDir, "windDir")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
        }}
      />
    </>
  );
}
