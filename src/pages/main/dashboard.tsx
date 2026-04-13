import { useState, useEffect } from "react";

// Components
import Sidebar from "../../components/widgets/Sidebar.tsx";
import Topbar from "../../components/widgets/Topbar.tsx";
import Card from "../../components/widgets/Card.tsx";
import WindRoseChart from "../../components/charts/WindRoseChart.tsx";
import PollutionRoseChart from "../../components/charts/PollutionRoseChart.tsx";
import SolarRadiationChart from "../../components/charts/SolarRadiationChart.tsx";
import LineSensorChart from "../../components/charts/LineSensorChart.tsx";
import DateRangePicker from "../../components/widgets/DateRangePicker.tsx";
import RealTimeParameters from "../../components/widgets/RealTimeParameters.tsx";
import StationMap from "../../components/widgets/StationMap.tsx";

// Services
import { getDevices } from "../../services/device.service";
import { getTimeSeriesData } from "../../services/telemetry.service";
import {
  getWindRoseData,
  getPollutionRoseData,
} from "../../services/liveData.service";

// Constants
import { PARAMETERS } from "../../data/constants";
import { useUnits } from "../../context/UnitContext";
import TableView from "../../components/widgets/TableView.tsx";
import EmptyState from "../../components/common/EmptyState.tsx";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getUnit } = useUnits();

  // Devices from backend
  const [devices, setDevices] = useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  const [device, setDevice] = useState("");
  const [params, setParams] = useState<string[]>([PARAMETERS[0].key]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [average, setAverage] = useState<
    "raw" | "1m" | "30m" | "1h" | "8h" | "8h_ma" | "24h" | "24h_ma"
  >("raw"); // Default to "raw" which maps to 1m interval
  const [view, setView] = useState<"graph" | "table">("graph");

  // Chart data from backend
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");

  // Live data for wind rose and pollution rose (10s updates)
  const [windRoseData, setWindRoseData] = useState<any>(null);
  const [pollutionRoseData, setPollutionRoseData] = useState<any>(null);
  const [windRoseLoading, setWindRoseLoading] = useState(true);
  const [pollutionRoseLoading, setPollutionRoseLoading] = useState(true);

  // Fetch devices from backend
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setDevicesLoading(true);
        const data = await getDevices({ status: "active" });
        setDevices(data.devices);

        // Set first device as default
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

  // Fetch chart data from backend
  useEffect(() => {
    if (!device) return;

    const fetchChartData = async () => {
      try {
        setChartLoading(true);
        setChartError("");

        // Get last 1 hour of data with 1-minute intervals
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const data = await getTimeSeriesData({
          deviceId: device,
          startDate: oneHourAgo.toISOString(),
          endDate: now.toISOString(),
          interval: "1m", // 1-minute intervals
          parameters: params.join(","),
        });

        // Transform backend data for chart
        // Backend returns: { bucket, so2_avg, no2_avg, temperature_avg, etc. }
        // Frontend expects: { t, so2, no2, temperature, etc. }
        const transformed = data.timeSeries.map((item: any) => {
          const result: any = {
            t: new Date(item.bucket).getTime(), // Use 't' for time axis
          };

          // Map aggregated params (so2_avg ->so2, no2_avg -> no2, etc.)
          params.forEach((param) => {
            // Special mapping for wind parameters (backend uses lowercase)
            let avgKey = `${param}_avg`;
            if (param === "windSpeed") {
              avgKey = "windspeed_avg"; // Backend uses lowercase
            } else if (param === "windDirection") {
              avgKey = "winddirection_avg"; // Backend uses lowercase
            }

            if (item[avgKey] !== null && item[avgKey] !== undefined) {
              result[param] = parseFloat(item[avgKey]); // Convert Decimal/String to number
            }
          });

          return result;
        });

        // Backend returns DESC (newest first), but chart needs ASC (oldest first for timeline)
        setChartData(transformed.reverse());
      } catch (error: any) {
        console.error("Failed to fetch chart data:", error);
        setChartError("Failed to load chart data");

        // Fallback to empty data
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchChartData, 60000);
    return () => clearInterval(interval);
  }, [device, params]);

  // Fetch table data from backend (using selected  // Table data
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [hasRecentTableData, setHasRecentTableData] = useState(true); // Track if data is within 3 hours

  const [deviceLastSeen, setDeviceLastSeen] = useState<string | null>(null); // Track last data timestamp

  useEffect(() => {
    if (!device || view !== "table") return;

    const fetchTableData = async () => {
      try {
        setTableLoading(true);

        // Determine date range
        let startTime: Date;
        let endTime: Date;
        const now = new Date();

        if (startDate && endDate) {
          // Use date range picker values
          // Parse yyyy-MM-dd as UTC to avoid timezone issues
          startTime = new Date(startDate + "T00:00:00.000Z");
          const selectedEndTime = new Date(endDate + "T23:59:59.999Z");

          // Cap end time to NOW if selected date is in the future
          endTime = selectedEndTime > now ? now : selectedEndTime;
        } else {
          // No dates selected - use default range based on interval
          endTime = now;

          switch (average) {
            case "raw":
              startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours for raw/1m
              break;
            case "30m":
              startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
              break;
            case "1h":
              startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
              break;
            case "8h":
            case "8h_ma":
              startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
              break;
            case "24h":
            case "24h_ma":
              startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days
              break;
            default:
              startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default 24 hours
          }
        }

        const data = await getTimeSeriesData({
          deviceId: device,
          startDate: startTime.toISOString(),
          endDate: endTime.toISOString(),
          interval: average === "raw" ? "1m" : average, // Map "raw" to 1m interval
          parameters:
            "so2,h2s,no2,btex,solar,temperature,humidity,windSpeed,windDirection,pressure,rain",
        });

        const transformed = data.timeSeries.map((item: any) => ({
          t: item.bucket,
          so2: item.so2_avg ?? null,
          h2s: item.h2s_avg ?? null,
          no2: item.no2_avg ?? null,
          btx: item.btex_avg ?? null,
          solar: item.solar_avg ?? null,
          temperature: item.temperature_avg ?? null,
          humidity: item.humidity_avg ?? null,
          pressure: item.pressure_avg ?? null,
          rain: item.rain_avg ?? null,
          windSpeed: item.windspeed_avg ?? null,
          windDir: item.winddirection_avg ?? null,
        }));

        setTableData(transformed);

        // Only check device activity if viewing current/recent data
        // Check against the ORIGINAL selected date, not the capped endTime
        const selectedEndDate = endDate
          ? new Date(endDate + "T23:59:59.999Z")
          : null;
        const viewingHistoricalData = selectedEndDate
          ? selectedEndDate < now
          : false;

        if (viewingHistoricalData) {
          // Viewing old data - always show it
          setHasRecentTableData(true);
        } else {
          // Viewing current/recent data - check if device is active
          try {
            const { getDeviceStatus } =
              await import("../../services/deviceStatus.service");
            const status = await getDeviceStatus(device);
            setHasRecentTableData(status.isActive);
            setDeviceLastSeen(status.latestTimestamp || null);
          } catch (error) {
            console.error("Failed to check device status:", error);
            // If check fails, show data anyway
            setHasRecentTableData(true);
            setDeviceLastSeen(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch table data:", error);
        setTableData([]);
        setHasRecentTableData(false); // Reset state on error
      } finally {
        setTableLoading(false);
      }
    };

    fetchTableData();
  }, [device, average, view, startDate, endDate]);

  // Fetch wind rose data (10s polling)
  useEffect(() => {
    if (!device) return;

    const fetchWindRose = async () => {
      try {
        setWindRoseLoading(true);
        const data = await getWindRoseData(device);
        setWindRoseData(data);
      } catch (error) {
        console.error("Failed to fetch wind rose data:", error);
        setWindRoseData(null);
      } finally {
        setWindRoseLoading(false);
      }
    };

    fetchWindRose();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchWindRose, 10000);
    return () => clearInterval(interval);
  }, [device]);

  // Fetch pollution rose data (10s polling)
  useEffect(() => {
    if (!device) return;

    const fetchPollutionRose = async () => {
      try {
        setPollutionRoseLoading(true);
        // Use SO2 as default parameter
        const data = await getPollutionRoseData(device, "SO2");
        setPollutionRoseData(data);
      } catch (error) {
        console.error("Failed to fetch pollution rose data:", error);
        setPollutionRoseData(null);
      } finally {
        setPollutionRoseLoading(false);
      }
    };

    fetchPollutionRose();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchPollutionRose, 10000);
    return () => clearInterval(interval);
  }, [device]);

  // Get metadata for selected parameters
  const selectedParamsMeta = params.map(
    (p) => PARAMETERS.find((param) => param.key === p)!,
  );
  const displayTitle =
    params.length === 1
      ? `${selectedParamsMeta[0].label} (${getUnit(selectedParamsMeta[0].key)}) | Live Data`
      : "Multiple Parameters | Live Data";

  return (
    <div className="flex bg-[#0f1a1a] min-h-screen text-gray-100 overflow-x-hidden min-w-0">
      <Sidebar
        active="Dashboard"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar
          title="Dashboard"
          view={view}
          setView={setView}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Controls */}
        <div className="bg-[#0f1717] px-4 sm:px-6 py-4 border-white/5 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-wrap">
            {/* Left Side */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
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

              {/* Date Range Picker (Only in Table View) */}
              {view === "table" && (
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              )}

              {/* Average Selector (Only in Table View) */}
              {view === "table" && (
                <div className="relative group">
                  <select
                    value={average}
                    onChange={(e) =>
                      setAverage(e.target.value as typeof average)
                    }
                    className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#0d1717] to-[#0d1717] border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none"
                  >
                    <option value="raw" className="bg-[#1a2a2a] text-white">
                      Raw Data
                    </option>
                    <option value="30m" className="bg-[#1a2a2a] text-white">
                      30 Minute Avg
                    </option>
                    <option value="1h" className="bg-[#1a2a2a] text-white">
                      1 Hour Avg
                    </option>
                    <option value="8h" className="bg-[#1a2a2a] text-white">
                      8 Hour Avg
                    </option>
                    <option value="8h_ma" className="bg-[#1a2a2a] text-white">
                      8 Hour Moving Avg
                    </option>
                    <option
                      value="24h"
                      className="bg-[#1a2a2a] text-white"
                      title="Requires >75% data availability (18+ hours) per DOE/EPA standards"
                    >
                      24 Hour Avg ⓘ
                    </option>
                    <option
                      value="24h_ma"
                      className="bg-[#1a2a2a] text-white"
                      title="Requires >75% data availability (18+ hours) per DOE/EPA standards"
                    >
                      24 Hour Moving Avg ⓘ
                    </option>
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
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Filter Button*/}
              {view === "table" && (
                <button className="bg-teal-600 px-4 py-2 rounded-lg font-medium text-black text-sm hover:bg-teal-700 transition-colors">
                  Filter
                </button>
              )}
            </div>

            {/* Right Side - View Toggle Buttons */}
            <div className="ml-auto flex items-center gap-2 bg-[#1a2a2a] rounded-md p-1 relative">
              {/* Animated Slider Background */}
              <div
                className={`absolute top-1 bottom-1 bg-teal-600 rounded transition-all duration-300 ease-in-out ${
                  view === "graph" ? "left-1" : "left-[calc(50%+0.25rem)]"
                }`}
                style={{
                  width: "calc(50% - 0.375rem)",
                }}
              />
              <button
                onClick={() => setView("graph")}
                className={`px-4 py-1.5 rounded text-sm transition-colors duration-300 relative z-10 ${
                  view === "graph"
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Graph View
              </button>
              <button
                onClick={() => setView("table")}
                className={`px-4 py-1.5 rounded text-sm transition-colors duration-300 relative z-10 ${
                  view === "table"
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Table View
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className={`flex-1 min-w-0 ${
            view === "table" ? "flex flex-col overflow-hidden" : "p-6"
          }`}
        >
          {view === "graph" ? (
            <div className="gap-5 grid grid-cols-1 xl:grid-cols-2">
              {/* Line Chart */}

              {/* Real-Time Parameters */}
              <div className="col-span-5 xl:col-span-1">
                <Card title="Real-Time Parameters">
                  <div className="w-full h-[20rem] sm:h-[24rem] lg:h-[28rem]">
                    <RealTimeParameters deviceId={device} />
                  </div>
                </Card>
              </div>

              {/* Station Location Map */}
              <div className="col-span-5 xl:col-span-2">
                <Card title="Station Location">
                  <div className="w-full h-[20rem] sm:h-[24rem] lg:h-[28rem]">
                    <StationMap
                      stationName={
                        devices.find((d) => d.id === device)?.name ||
                        "Unknown Station"
                      }
                      location={
                        devices.find((d) => d.id === device)?.location ||
                        "Unknown Location"
                      }
                      latitude={
                        devices.find((d) => d.id === device)?.latitude
                          ? parseFloat(
                              devices.find((d) => d.id === device)!.latitude!,
                            )
                          : undefined
                      }
                      longitude={
                        devices.find((d) => d.id === device)?.longitude
                          ? parseFloat(
                              devices.find((d) => d.id === device)!.longitude!,
                            )
                          : undefined
                      }
                      status={
                        devices.find((d) => d.id === device)?.status || "active"
                      }
                    />
                  </div>
                </Card>
              </div>

              <div className="md:col-span-5 xl:col-span-3">
                <Card
                  title={displayTitle}
                  right={
                    <div className="relative group">
                      <select
                        value={params[0]}
                        onChange={(e) => setParams([e.target.value])}
                        className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#0d1717] to-[#0d1717] border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none"
                      >
                        {PARAMETERS.map((p) => (
                          <option
                            key={p.key}
                            value={p.key}
                            className="bg-[#1a2a2a] text-white"
                          >
                            {p.label} ({p.unit})
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
                  }
                >
                  {chartLoading ? (
                    <div className="h-96 flex items-center justify-center">
                      <div className="text-teal-400">Loading chart data...</div>
                    </div>
                  ) : chartError ? (
                    <div className="h-96 flex items-center justify-center">
                      <div className="text-red-400">{chartError}</div>
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="h-96">
                      <EmptyState
                        compact
                        title="No Chart Data"
                        message="The device may be offline or no data has been recorded yet."
                      />
                    </div>
                  ) : (
                    <LineSensorChart data={chartData} params={params} />
                  )}
                </Card>
              </div>

              {/* Wind Rose Chart */}
              <div className="col-span-5 xl:col-span-1">
                <Card
                  title="Wind Rose"
                  right={
                    <div className="relative group">
                      <select className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#0d1717] to-[#0d1717] border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none">
                        <option>Direction From</option>
                        <option>Direction To</option>
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
                  }
                >
                  <div className="w-full h-[20rem] sm:h-[24rem] lg:h-[28rem]">
                    {windRoseLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-teal-400">Loading...</div>
                      </div>
                    ) : !windRoseData ? (
                      <EmptyState
                        compact
                        title="No Wind Data"
                        message="The device may be offline or no data has been recorded yet."
                      />
                    ) : (
                      <WindRoseChart
                        data={windRoseData}
                        loading={windRoseLoading}
                      />
                    )}
                  </div>
                </Card>
              </div>

              {/* Pollution Rose Chart */}
              <div className="col-span-5 xl:col-span-2">
                <Card
                  title="Pollution Rose"
                  right={
                    <div className="relative group">
                      <select className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#0d1717] to-[#0d1717] border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none">
                        <option>Direction From</option>
                        <option>Direction To</option>
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
                  }
                >
                  <div className="w-full h-[20rem] sm:h-[24rem] lg:h-[28rem]">
                    {pollutionRoseLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-teal-400">Loading...</div>
                      </div>
                    ) : !pollutionRoseData ? (
                      <EmptyState
                        compact
                        title="No Pollution Data"
                        message="The device may be offline or no data has been recorded yet."
                      />
                    ) : (
                      <PollutionRoseChart
                        data={pollutionRoseData}
                        loading={pollutionRoseLoading}
                      />
                    )}
                  </div>
                </Card>
              </div>

              <div className="col-span-1 md:col-span-5 xl:col-span-3">
                <Card title="Solar Radiation">
                  <div className="w-full h-[20rem] sm:h-[24rem] lg:h-[28rem]">
                    <SolarRadiationChart deviceId={device} />
                  </div>
                </Card>
              </div>
            </div>
          ) : tableLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-teal-400">Loading table data...</div>
            </div>
          ) : !hasRecentTableData || tableData.length === 0 ? (
            <EmptyState
              title="No Data Found"
              message="Your device may be offline"
              lastDataTimestamp={deviceLastSeen}
            />
          ) : (
            <TableView
              data={tableData}
              device={device}
              devices={devices}
              startDate={startDate}
              endDate={endDate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
