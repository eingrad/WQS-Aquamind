import { useState, useEffect } from "react";

// Components
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import Card from "../../components/widgets/Card";
import AnalyticsChart from "../../components/charts/AnalyticsChart";
import DateRangePicker from "../../components/widgets/DateRangePicker";
import EmptyState from "../../components/common/EmptyState";

// Services
import { getDevices } from "../../services/device.service";
import { getTimeSeriesData } from "../../services/telemetry.service";

// Constants
import { PARAMETERS } from "../../data/constants";
import { useUnits } from "../../context/UnitContext";

// Time average options
const TIME_AVERAGES = [
  { value: "30m", label: "30 Minute Avg" },
  { value: "1h", label: "1 Hour Avg" },
  { value: "8h", label: "8 Hour Avg" },
  { value: "24h", label: "24 Hour Avg" },
] as const;

type TimeAverage = (typeof TIME_AVERAGES)[number]["value"];

// Default date ranges based on interval
function getDefaultDateRange(interval: TimeAverage): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  let start: Date;

  switch (interval) {
    case "30m":
    case "1h":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
      break;
    case "8h":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
      break;
    case "24h":
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days
      break;
    default:
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { start, end: now };
}

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { convert, getUnit } = useUnits();

  // Devices
  const [devices, setDevices] = useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [device, setDevice] = useState("");

  // Parameters (multi-select)
  const [selectedParams, setSelectedParams] = useState<string[]>(["so2"]);
  const [isParamDropdownOpen, setIsParamDropdownOpen] = useState(false);

  // Time average
  const [timeAverage, setTimeAverage] = useState<TimeAverage>("1h");

  // Date range
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Chart data
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");

  // Auto-detected latest data timestamp for the device
  const [latestDataTime, setLatestDataTime] = useState<Date | null>(null);

  // Fetch devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setDevicesLoading(true);
        const data = await getDevices({ status: "active" });
        setDevices(data.devices);
        if (data.devices.length > 0) {
          setDevice(data.devices[0].id);
        }
      } catch (error: any) {
        console.error("Failed to fetch devices:", error);
        setChartError("Failed to load devices");
      } finally {
        setDevicesLoading(false);
      }
    };
    fetchDevices();
  }, []);

  // Fetch latest data timestamp when device changes
  useEffect(() => {
    if (!device) return;

    const fetchLatestTime = async () => {
      try {
        const { getDeviceStatus } =
          await import("../../services/deviceStatus.service");
        const status = await getDeviceStatus(device);
        if (status.latestTimestamp) {
          setLatestDataTime(new Date(status.latestTimestamp));
        } else {
          setLatestDataTime(null);
        }
      } catch (error) {
        console.error("Failed to fetch device status:", error);
        setLatestDataTime(null);
      }
    };
    fetchLatestTime();
  }, [device]);

  // Fetch chart data
  useEffect(() => {
    if (!device || selectedParams.length === 0) return;

    const fetchData = async () => {
      try {
        setChartLoading(true);
        setChartError("");

        // Determine date range
        let startTime: Date;
        let endTime: Date;

        if (startDate && endDate) {
          // User selected custom date range
          const now = new Date();
          startTime = new Date(startDate + "T00:00:00.000Z");
          const selectedEnd = new Date(endDate + "T23:59:59.999Z");
          endTime = selectedEnd > now ? now : selectedEnd;
        } else {
          // Auto-detect: use latest data timestamp as end, or fall back to now
          const anchor = latestDataTime || new Date();
          const defaults = getDefaultDateRange(timeAverage);
          // Calculate the lookback duration and apply it from the anchor
          const lookbackMs = defaults.end.getTime() - defaults.start.getTime();
          endTime = anchor;
          startTime = new Date(anchor.getTime() - lookbackMs);
        }

        const data = await getTimeSeriesData({
          deviceId: device,
          startDate: startTime.toISOString(),
          endDate: endTime.toISOString(),
          interval: timeAverage,
          parameters: selectedParams.join(","),
        });

        // Transform backend data for chart
        const transformed = data.timeSeries.map((item: any) => {
          const result: any = {
            t: new Date(item.bucket).getTime(),
          };

          selectedParams.forEach((param) => {
            let avgKey = `${param}_avg`;
            if (param === "windSpeed") avgKey = "windspeed_avg";
            else if (param === "windDirection") avgKey = "winddirection_avg";

            if (item[avgKey] !== null && item[avgKey] !== undefined) {
              const raw = parseFloat(item[avgKey]);
              result[param] = convert(raw, param) ?? raw;
            }
          });

          return result;
        });

        setChartData(transformed.reverse());
      } catch (error: any) {
        console.error("Failed to fetch analytics data:", error);
        setChartError("Failed to load analytics data");
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchData();
  }, [
    device,
    selectedParams,
    timeAverage,
    startDate,
    endDate,
    convert,
    latestDataTime,
  ]);

  // Toggle parameter selection
  const toggleParam = (key: string) => {
    setSelectedParams((prev) => {
      if (prev.includes(key)) {
        // Don't allow deselecting the last one
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== key);
      }
      return [...prev, key];
    });
  };

  // Select all / deselect all
  const selectAllParams = () => {
    setSelectedParams(PARAMETERS.map((p) => p.key));
  };

  const deselectAllParams = () => {
    setSelectedParams(["so2"]); // Keep at least one
  };

  // Build chart title
  const selectedMeta = selectedParams.map(
    (p) => PARAMETERS.find((param) => param.key === p)!,
  );
  const chartTitle =
    selectedParams.length === 1
      ? `${selectedMeta[0].label} (${getUnit(selectedMeta[0].key)})`
      : `${selectedParams.length} Parameters Selected`;

  const avgLabel =
    TIME_AVERAGES.find((t) => t.value === timeAverage)?.label || "";

  return (
    <div className="flex bg-[#0f1a1a] min-h-screen text-gray-100 overflow-x-hidden min-w-0">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #14b8a6;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0d9488;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #474747ff #1f2937;
        }
      `}</style>
      <Sidebar active="Analytics" isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title="Analytics" onMenuToggle={() => setSidebarOpen(true)} />

        {/* Controls */}
        <div className="bg-[#0f1717] px-4 sm:px-6 py-4 border-white/5 border-b">
          <div className="flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
            {/* Device Selector */}
            <div className="relative group">
              <select
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                disabled={devicesLoading}
                className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#0d1717] to-[#0d1717] border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none disabled:opacity-50"
              >
                {devicesLoading ? (
                  <option>Loading devices...</option>
                ) : devices.length > 0 ? (
                  devices.map((d) => (
                    <option
                      value={d.id}
                      key={d.id}
                      className="bg-[#1a2a2a] text-white"
                    >
                      {d.name}
                    </option>
                  ))
                ) : (
                  <option>No devices found</option>
                )}
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
                    strokeWidth={1}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Date Range Picker */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />

            {/* Time Average Selector */}
            <div className="relative group">
              <select
                value={timeAverage}
                onChange={(e) => setTimeAverage(e.target.value as TimeAverage)}
                className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#0d1717] to-[#0d1717] border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none"
              >
                {TIME_AVERAGES.map((avg) => (
                  <option
                    key={avg.value}
                    value={avg.value}
                    className="bg-[#1a2a2a] text-white"
                  >
                    {avg.label}
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
                    strokeWidth={1}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Parameter Multi-Select Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsParamDropdownOpen(!isParamDropdownOpen)}
                className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#0d1717] to-[#0d1717] border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer min-w-[220px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none text-left"
              >
                {selectedParams.length === PARAMETERS.length
                  ? "All Parameters"
                  : selectedParams.length === 1
                    ? PARAMETERS.find((p) => p.key === selectedParams[0])?.label
                    : `${selectedParams.length} Parameters`}
              </button>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className={`w-4 h-4 text-teal-400 transition-transform ${
                    isParamDropdownOpen ? "rotate-180" : ""
                  }`}
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
              </div>

              {/* Dropdown */}
              {isParamDropdownOpen && (
                <div className="absolute top-full mt-2 z-50 bg-[#1a2a2a] rounded-lg shadow-2xl border border-white/10 overflow-hidden min-w-[260px]">
                  {/* Select All / Deselect All */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                    <button
                      onClick={selectAllParams}
                      className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllParams}
                      className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>

                  {/* Parameter Checkboxes */}
                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                    {PARAMETERS.map((param) => (
                      <label
                        key={param.key}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedParams.includes(param.key)}
                          onChange={() => toggleParam(param.key)}
                          className="w-4 h-4 rounded border-white/20 bg-transparent text-teal-500 focus:ring-teal-500/20 focus:ring-offset-0 cursor-pointer accent-teal-500"
                        />
                        <span className="text-sm text-gray-200">
                          {param.label}
                        </span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {getUnit(param.key)}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Done Button */}
                  <div className="px-4 py-2.5 border-t border-white/10">
                    <button
                      onClick={() => setIsParamDropdownOpen(false)}
                      className="w-full bg-teal-600 text-black text-sm font-medium py-2 rounded-lg hover:bg-teal-500 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Parameters Chips */}
          {selectedParams.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedParams.map((key) => {
                const param = PARAMETERS.find((p) => p.key === key);
                if (!param) return null;
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-500/15 text-teal-300 border border-teal-500/20"
                  >
                    {param.label}
                    {selectedParams.length > 1 && (
                      <button
                        onClick={() => toggleParam(key)}
                        className="ml-0.5 hover:text-teal-100 transition-colors"
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

        {/* Chart Content */}
        <div className="flex-1 p-6 min-w-0">
          <Card title={`${chartTitle} | ${avgLabel}`}>
            {chartLoading ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-teal-400 text-sm">
                    Loading analytics data...
                  </span>
                </div>
              </div>
            ) : chartError ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="text-red-400">{chartError}</div>
              </div>
            ) : chartData.length === 0 ? (
              <EmptyState
                title="No Data Available"
                message="Try adjusting your date range or parameters"
              />
            ) : (
              <div className="h-[500px]">
                <AnalyticsChart data={chartData} params={selectedParams} />
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Click outside to close parameter dropdown */}
      {isParamDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsParamDropdownOpen(false)}
        />
      )}
    </div>
  );
}
