import { Flag } from "lucide-react";
import DateRangePicker from "../widgets/DateRangePicker";

interface Device {
  id: string;
  name: string;
  location: string;
}

interface ValidationControlsProps {
  selectedDevice: string;
  startDate: string;
  endDate: string;
  selectedCellsCount: number;
  devices: Device[];
  onDeviceChange: (device: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onFlag: () => void;
  onValidate: () => void;
}

export default function ValidationControls({
  selectedDevice,
  startDate,
  endDate,
  selectedCellsCount,
  devices,
  onDeviceChange,
  onStartDateChange,
  onEndDateChange,
  onFlag,
}: ValidationControlsProps) {
  return (
    <div className="bg-[#0f1717] px-4 sm:px-6 py-4 border-white/5 border-b">
      <div className="flex flex-wrap items-center gap-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <select
              value={selectedDevice}
              onChange={(e) => onDeviceChange(e.target.value)}
              className="px-4 py-2.5 pr-10 rounded-lg text-sm border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none"
            >
              <option value="" className="bg-[#1a2a2a] text-white">
                All Devices
              </option>
              {devices.map((device) => (
                <option
                  key={device.id}
                  value={device.id}
                  className="bg-[#1a2a2a] text-white"
                >
                  {device.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-teal-400"
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

          {/* Date Range Picker */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onFlag}
            disabled={selectedCellsCount === 0}
            className="bg-teal-600 px-4 py-2 rounded-lg font-medium text-white text-sm hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Flag className="w-4 h-4" />
            Flag
          </button>
          {selectedCellsCount > 0 && (
            <span className="text-sm text-teal-400 ml-2">
              {selectedCellsCount} cells selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
