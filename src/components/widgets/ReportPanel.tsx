import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import DateRangePicker from "./DateRangePicker";

export default function ReportPanel({ onClose }: { onClose: () => void }) {
  const [selectedDevice, setSelectedDevice] = useState("");
  const [frequencies, setFrequencies] = useState<string[]>([]);
  const [exportTypes, setExportTypes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCheckbox = (
    value: string,
    list: string[],
    setter: (v: string[]) => void
  ) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const generateReport = () => {
    console.log({
      selectedDevice,
      frequencies,
      startDate,
      endDate,
      exportTypes,
    });
    // Add actual report generation logic here
    onClose();
  };

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-[#0f1a1a] border-l border-white/10 z-[1000] p-6 overflow-y-auto flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-white">Reports</h2>
        <button onClick={onClose}>
          <X className="text-white w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6 text-sm flex-grow">
        {/* Device Dropdown */}
        <div>
          <label className="block text-sm mb-3 text-white">
            Devices Name<span className="text-red-500"> *</span>
          </label>
          <div className="relative">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-4 py-3 pr-10 rounded-lg bg-[#0f1a1a] text-sm border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none"
            >
              <option value="">-- Select Device --</option>
              <option value="PENGERANG">Pengerang Station</option>
              {/* Add more options as needed */}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-teal-400 pointer-events-none" />
          </div>
        </div>

        {/* Frequency Checkboxes */}
        <div className="pt-4 border-t border-white/10 mt-auto">
          <div>
            <label className="block mb-3 text-white">Report Frequency</label>
            <div className="flex gap-18">
              {["Daily", "Weekly", "Monthly"].map((item) => (
                <label key={item} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={frequencies.includes(item)}
                    onChange={() =>
                      handleCheckbox(item, frequencies, setFrequencies)
                    }
                    className="accent-teal-500"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="pt-4 border-t border-white/10 mt-auto">
          <div>
            <label className="block mb-3 text-white">Date Range</label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              fullWidth
            />
          </div>
        </div>

        {/* Export Type Checkboxes */}
        <div className="pt-4 border-t border-white/10 mt-auto">
          <label className="block mb-3 text-gray-300">Export Format</label>
          <div className="flex gap-25">
            {["CSV", "PDF", "TXT"].map((item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportTypes.includes(item)}
                  onChange={() =>
                    handleCheckbox(item, exportTypes, setExportTypes)
                  }
                  className="accent-teal-500"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 flex justify-between mt-auto">
        <button
          onClick={generateReport}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Generate Report
        </button>
        <button
          onClick={onClose}
          className="border border-white/20 px-4 py-2 rounded-md text-sm text-white hover:bg-white/10"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
