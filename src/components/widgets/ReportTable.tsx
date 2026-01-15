import { Download, Trash2 } from "lucide-react";

const reportData = [
  {
    id: "AEMS_PRG01",
    name: "Pengerang Air Monitoring Station",
    type: "Daily",
    format: "PDF",
  },
  {
    id: "AEMS_PRG01",
    name: "Pengerang Air Monitoring Station",
    type: "Weekly",
    format: "PDF",
  },
  {
    id: "AEMS_PRG01",
    name: "Pengerang Air Monitoring Station",
    type: "Monthly",
    format: "PDF",
  },
  {
    id: "AEMS_PRG01",
    name: "Pengerang Air Monitoring Station",
    type: "Monthly",
    format: "PDF",
  },
];

export default function ReportTable() {
  return (
    <>
      {/* Reports Table */}
      <div className="w-full overflow-x-auto border border-white/5 bg-[#0f1a1a]">
        <p className="p-4 text-white font-semibold text-lg">Existing Reports</p>
        <table className="min-w-full text-sm text-left text-white mt-4">
          <thead className="border-b border-white/5">
            <tr>
              <th className="px-5 py-3"></th>
              <th className="px-4 py-3">Device ID</th>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Device Name</th>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Report Type</th>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Report Format</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {reportData.map((item, i) => (
              <tr
                key={`${item.id}-${item.type}-${i}`}
                className="hover:bg-white/5"
              >
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3">{item.type}</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3">{item.format}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded text-md flex items-center gap-1">
                      <Download size={16} />
                    </button>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-md flex items-center gap-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
