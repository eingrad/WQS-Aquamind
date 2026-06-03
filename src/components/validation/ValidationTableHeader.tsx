import { useUnits } from "../../context/UnitContext";

export default function ValidationTableHeader() {
  const { getUnit } = useUnits();

  const columns = [
    { label: "pH",          key: "ph" },
    { label: "DO",          key: "do" },
    { label: "NH₃-N",      key: "nh3n" },
    { label: "COD",         key: "cod" },
    { label: "BOD",         key: "bod" },
    { label: "TSS",         key: "tss" },
    { label: "Temperature", key: "temperature" },
    { label: "Depth",       key: "depth" },
  ];

  return (
    <thead className="bg-[#e2e8f0] sticky top-0 z-10">
      <tr>
        <th className="px-4 py-3 text-left font-semibold border-r border-slate-200 min-w-[180px]">
          Date & Time
        </th>
        <th className="px-4 py-3 text-left font-semibold border-r border-slate-200 min-w-[140px]">
          Location
        </th>
        {columns.map((col) => (
          <th
            key={col.key}
            className="px-4 py-3 text-center font-semibold border-r border-slate-200 min-w-[120px]"
          >
            <div>{col.label}</div>
            <div className="text-xs font-normal text-slate-500">
              {getUnit(col.key)}
            </div>
          </th>
        ))}
        <th className="w-[10%] px-4 py-3 text-center font-semibold">
          Actions
        </th>
      </tr>
    </thead>
  );
}
