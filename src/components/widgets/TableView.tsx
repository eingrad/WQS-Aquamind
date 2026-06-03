import { useState } from "react";
import Pagination from "./Pagination";
import { formatPollutantValue } from "../../utils/numberFormat";
import { formatDateTime } from "../../utils/dateFormat";
import { useUnits } from "../../context/UnitContext";

interface DataRow {
  t: string;
  ph: number;
  do: number;
  nh3n: number;
  cod: number;
  bod: number;
  tss: number;
  wqi: number;
  temperature: number;
  pressure: number;
  depth: number;
}

type TableViewProps = {
  data: DataRow[];
  device: string;
  startDate?: string;
  endDate?: string;
  devices: any[];
};

export default function TableView({ data, device, devices }: TableViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const { convert, getUnit } = useUnits();

  const filteredData = data;

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
          background: #2563eb;
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
            <thead className="bg-[#e2e8f0] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold border-r border-[#e2e8f0] min-w-[180px]">
                  Time & Date
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#e2e8f0] min-w-[140px]">
                  Location
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#e2e8f0] min-w-[100px]">
                  <div>pH</div>
                  <div className="text-xs font-normal text-slate-500">{getUnit("ph")}</div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#e2e8f0] min-w-[100px]">
                  <div>DO</div>
                  <div className="text-xs font-normal text-slate-500">{getUnit("do")}</div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#e2e8f0] min-w-[110px]">
                  <div>NH₃-N</div>
                  <div className="text-xs font-normal text-slate-500">{getUnit("nh3n")}</div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#e2e8f0] min-w-[100px]">
                  <div>COD</div>
                  <div className="text-xs font-normal text-slate-500">{getUnit("cod")}</div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#e2e8f0] min-w-[100px]">
                  <div>BOD</div>
                  <div className="text-xs font-normal text-slate-500">{getUnit("bod")}</div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#e2e8f0] min-w-[100px]">
                  <div>TSS</div>
                  <div className="text-xs font-normal text-slate-500">{getUnit("tss")}</div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#e2e8f0] min-w-[100px]">
                  <div>WQI</div>
                  <div className="text-xs font-normal text-slate-500">{getUnit("wqi")}</div>
                </th>
                <th className="px-4 py-3 text-center font-semibold border-r border-[#e2e8f0] min-w-[120px]">
                  <div>Temperature</div>
                  <div className="text-xs font-normal text-slate-500">{getUnit("temperature")}</div>
                </th>
                <th className="px-4 py-3 text-center font-semibold min-w-[100px]">
                  <div>Depth</div>
                  <div className="text-xs font-normal text-slate-500">{getUnit("depth")}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-100">
                  <td className="px-4 py-3 text-left">{formatDateTime(row.t)}</td>
                  <td className="px-4 py-3 text-center">
                    {devices.find((d) => d.id === device)?.location || "–"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatPollutantValue(convert(row.ph, "ph") ?? row.ph, "ph")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatPollutantValue(convert(row.do, "do") ?? row.do, "do")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatPollutantValue(convert(row.nh3n, "nh3n") ?? row.nh3n, "nh3n")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatPollutantValue(convert(row.cod, "cod") ?? row.cod, "cod")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatPollutantValue(convert(row.bod, "bod") ?? row.bod, "bod")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatPollutantValue(convert(row.tss, "tss") ?? row.tss, "tss")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatPollutantValue(convert(row.wqi, "wqi") ?? row.wqi, "wqi")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatPollutantValue(convert(row.temperature, "temperature") ?? row.temperature, "temperature")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatPollutantValue(convert(row.depth, "depth") ?? row.depth, "depth")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
