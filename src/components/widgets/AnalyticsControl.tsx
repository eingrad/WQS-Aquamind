import { memo } from "react";
import DateRangePicker from "../widgets/DateRangePicker";
import ParamDropdown from "./ParamDropdown";
import { PARAMETERS } from "../../data/constants";

const TIME_AVERAGES = [
  { value: "30m", label: "30 Minute Avg" },
  { value: "1h", label: "1 Hour Avg" },
  { value: "8h", label: "8 Hour Avg" },
  { value: "24h", label: "24 Hour Avg" },
] as const;

type TimeAverage = (typeof TIME_AVERAGES)[number]["value"];

type Props = {
  // Devices
  devices: any[];
  devicesLoading: boolean;
  device: string;
  onDeviceChange: (id: string) => void;
  // Date range
  startDate: string;
  endDate: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  // Time average
  timeAverage: TimeAverage;
  onTimeAverageChange: (v: TimeAverage) => void;
  // Params
  selectedParams: string[];
  onToggleParam: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  getUnit: (key: string) => string;
};

const AnalyticsControls = memo(function AnalyticsControls({
  devices,
  devicesLoading,
  device,
  onDeviceChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  timeAverage,
  onTimeAverageChange,
  selectedParams,
  onToggleParam,
  onSelectAll,
  onDeselectAll,
  getUnit,
}: Props) {
  return (
    <div className="bg-[#ffffff] px-4 sm:px-6 py-4 border-slate-200 border-b">
      <div className="flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
        {/* Device Selector */}
        <div className="relative group">
          <select
            value={device}
            onChange={(e) => onDeviceChange(e.target.value)}
            disabled={devicesLoading}
            className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#ffffff] to-[#ffffff] border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none disabled:opacity-50"
          >
            {devicesLoading ? (
              <option>Loading devices...</option>
            ) : devices.length > 0 ? (
              devices.map((d) => (
                <option
                  key={d.id}
                  value={d.id}
                  className="bg-[#e2e8f0] text-slate-800"
                >
                  {d.name}
                </option>
              ))
            ) : (
              <option>No devices found</option>
            )}
          </select>
          <ChevronIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-600" />
        </div>

        {/* Date Range */}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />

        {/* Time Average */}
        <div className="relative group">
          <select
            value={timeAverage}
            onChange={(e) => onTimeAverageChange(e.target.value as TimeAverage)}
            className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#ffffff] to-[#ffffff] border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
          >
            {TIME_AVERAGES.map((avg) => (
              <option
                key={avg.value}
                value={avg.value}
                className="bg-[#e2e8f0] text-slate-800"
              >
                {avg.label}
              </option>
            ))}
          </select>
          <ChevronIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-600" />
        </div>

        {/* Param Multi-Select */}
        <ParamDropdown
          selectedParams={selectedParams}
          onToggle={onToggleParam}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          getUnit={getUnit}
        />
      </div>

      {/* Selected Param Chips */}
      {selectedParams.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedParams.map((key) => {
            const param = PARAMETERS.find((p) => p.key === key);
            if (!param) return null;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-600 border border-blue-500/20"
              >
                {param.label}
                {selectedParams.length > 1 && (
                  <button
                    onClick={() => onToggleParam(key)}
                    className="ml-0.5 hover:text-blue-800 transition-colors"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default AnalyticsControls;

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 text-blue-600 transition-colors ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}
