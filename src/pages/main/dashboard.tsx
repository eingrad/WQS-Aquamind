import { useState, useEffect } from "react";

// Components
import Sidebar from "../../components/widgets/Sidebar.tsx";
import Topbar from "../../components/widgets/Topbar.tsx";
import Card from "../../components/widgets/Card.tsx";
import LineSensorChart from "../../components/charts/LineSensorChart.tsx";
import DateRangePicker from "../../components/widgets/DateRangePicker.tsx";
import RealTimeParameters from "../../components/widgets/RealTimeParameters.tsx";
import StationMap from "../../components/widgets/StationMap.tsx";

// Services
import { getDevices } from "../../services/device.service";
import { getTimeSeriesData } from "../../services/telemetry.service";

// Constants
import { PARAMETERS } from "../../data/constants";
import { useUnits } from "../../context/UnitContext";
import TableView from "../../components/widgets/TableView.tsx";
import EmptyState from "../../components/common/EmptyState.tsx";

const ALL_PARAM_KEYS = PARAMETERS.map((p) => p.key).join(",");

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
  >("raw");
  const [view, setView] = useState<"graph" | "table">("graph");

  // Chart data from backend
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");

  // Table data
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [hasRecentTableData, setHasRecentTableData] = useState(true);
  const [deviceLastSeen, setDeviceLastSeen] = useState<string | null>(null);

  // Fetch devices from backend
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

  // Fetch chart data from backend
  useEffect(() => {
    if (!device) return;

    const fetchChartData = async () => {
      try {
        setChartLoading(true);
        setChartError("");

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const data = await getTimeSeriesData({
          deviceId: device,
          startDate: oneHourAgo.toISOString(),
          endDate: now.toISOString(),
          interval: "1m",
          parameters: params.join(","),
        });

        // Backend returns { bucket, ph_avg, do_avg, nh3n_avg, ... }
        // Chart expects { t, ph, do, nh3n, ... }
        const transformed = data.timeSeries.map((item: any) => {
          const result: any = { t: new Date(item.bucket).getTime() };

          params.forEach((param) => {
            const avgKey = `${param}_avg`;
            if (item[avgKey] !== null && item[avgKey] !== undefined) {
              result[param] = parseFloat(item[avgKey]);
            }
          });

          return result;
        });

        // Backend returns DESC (newest first); chart needs ASC
        setChartData(transformed.reverse());
      } catch (error: any) {
        console.error("Failed to fetch chart data:", error);
        setChartError("Failed to load chart data");
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();

    const interval = setInterval(fetchChartData, 60000);
    return () => clearInterval(interval);
  }, [device, params]);

  // Fetch table data
  useEffect(() => {
    if (!device || view !== "table") return;

    const fetchTableData = async () => {
      try {
        setTableLoading(true);

        let startTime: Date;
        let endTime: Date;
        const now = new Date();

        if (startDate && endDate) {
          startTime = new Date(startDate + "T00:00:00.000Z");
          const selectedEndTime = new Date(endDate + "T23:59:59.999Z");
          endTime = selectedEndTime > now ? now : selectedEndTime;
        } else {
          endTime = now;

          switch (average) {
            case "raw":
              startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              break;
            case "30m":
            case "1h":
              startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case "8h":
            case "8h_ma":
              startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case "24h":
            case "24h_ma":
              startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
              break;
            default:
              startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          }
        }

        const data = await getTimeSeriesData({
          deviceId: device,
          startDate: startTime.toISOString(),
          endDate: endTime.toISOString(),
          interval: average === "raw" ? "1m" : average,
          parameters: ALL_PARAM_KEYS,
        });

        const transformed = data.timeSeries.map((item: any) => ({
          t: item.bucket,
          ph: item.ph_avg ?? null,
          do: item.do_avg ?? null,
          nh3n: item.nh3n_avg ?? null,
          cod: item.cod_avg ?? null,
          bod: item.bod_avg ?? null,
          tss: item.tss_avg ?? null,
          wqi: item.wqi_avg ?? null,
          temperature: item.temperature_avg ?? null,
          pressure: item.pressure_avg ?? null,
          depth: item.depth_avg ?? null,
        }));

        setTableData(transformed);

        const selectedEndDate = endDate
          ? new Date(endDate + "T23:59:59.999Z")
          : null;
        const viewingHistoricalData = selectedEndDate
          ? selectedEndDate < now
          : false;

        if (viewingHistoricalData) {
          setHasRecentTableData(true);
        } else {
          try {
            const { getDeviceStatus } =
              await import("../../services/deviceStatus.service");
            const status = await getDeviceStatus(device);
            setHasRecentTableData(status.isActive);
            setDeviceLastSeen(status.latestTimestamp || null);
          } catch {
            setHasRecentTableData(true);
            setDeviceLastSeen(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch table data:", error);
        setTableData([]);
        setHasRecentTableData(false);
      } finally {
        setTableLoading(false);
      }
    };

    fetchTableData();
  }, [device, average, view, startDate, endDate]);

  const selectedParamsMeta = params.map(
    (p) => PARAMETERS.find((param) => param.key === p)!,
  );
  const displayTitle =
    params.length === 1
      ? `${selectedParamsMeta[0].label} (${getUnit(selectedParamsMeta[0].key)}) | Live Data`
      : "Multiple Parameters | Live Data";

  const currentDevice = devices.find((d) => d.id === device);

  return (
    <div className="flex bg-[#ffffff] min-h-screen text-slate-700 overflow-x-hidden min-w-0">
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
        <div className="bg-[#ffffff] px-4 sm:px-6 py-4 border-slate-200 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-wrap">
            {/* Left Side */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
              {/* Device Selector */}
              <div className="relative group">
                <select
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  disabled={devicesLoading}
                  className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#ffffff] to-[#ffffff] border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none disabled:opacity-50"
                >
                  {devicesLoading ? (
                    <option>Loading devices...</option>
                  ) : devices.length > 0 ? (
                    devices.map((d) => (
                      <option
                        value={d.id}
                        key={d.id}
                        className="bg-[#e2e8f0] text-slate-800"
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
                    className="w-4 h-4 text-blue-600 group-hover:text-blue-600 transition-colors"
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

              {/* Date Range Picker (Table View only) */}
              {view === "table" && (
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              )}

              {/* Interval Selector (Table View only) */}
              {view === "table" && (
                <div className="relative group">
                  <select
                    value={average}
                    onChange={(e) =>
                      setAverage(e.target.value as typeof average)
                    }
                    className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#ffffff] to-[#ffffff] border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
                  >
                    <option value="raw" className="bg-[#e2e8f0] text-slate-800">
                      Raw Data
                    </option>
                    <option value="30m" className="bg-[#e2e8f0] text-slate-800">
                      30 Minute Avg
                    </option>
                    <option value="1h" className="bg-[#e2e8f0] text-slate-800">
                      1 Hour Avg
                    </option>
                    <option value="8h" className="bg-[#e2e8f0] text-slate-800">
                      8 Hour Avg
                    </option>
                    <option value="8h_ma" className="bg-[#e2e8f0] text-slate-800">
                      8 Hour Moving Avg
                    </option>
                    <option value="24h" className="bg-[#e2e8f0] text-slate-800">
                      24 Hour Avg
                    </option>
                    <option value="24h_ma" className="bg-[#e2e8f0] text-slate-800">
                      24 Hour Moving Avg
                    </option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-blue-600 group-hover:text-blue-600 transition-colors"
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

              {view === "table" && (
                <button className="bg-blue-600 px-4 py-2 rounded-lg font-medium text-black text-sm hover:bg-blue-700 transition-colors">
                  Filter
                </button>
              )}
            </div>

            {/* Right Side - View Toggle */}
            <div className="ml-auto flex items-center gap-2 bg-[#e2e8f0] rounded-md p-1 relative">
              <div
                className={`absolute top-1 bottom-1 bg-blue-600 rounded transition-all duration-300 ease-in-out ${
                  view === "graph" ? "left-1" : "left-[calc(50%+0.25rem)]"
                }`}
                style={{ width: "calc(50% - 0.375rem)" }}
              />
              <button
                onClick={() => setView("graph")}
                className={`px-4 py-1.5 rounded text-sm transition-colors duration-300 relative z-10 ${
                  view === "graph"
                    ? "text-slate-800"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Widget View
              </button>
              <button
                onClick={() => setView("table")}
                className={`px-4 py-1.5 rounded text-sm transition-colors duration-300 relative z-10 ${
                  view === "table"
                    ? "text-slate-800"
                    : "text-slate-500 hover:text-slate-800"
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
              {/* Real-Time Parameters */}
              <div className="xl:col-span-1">
                <Card title="Real-Time Parameters">
                  <div className="w-full h-[20rem] sm:h-[24rem] lg:h-[28rem]">
                    <RealTimeParameters deviceId={device} />
                  </div>
                </Card>
              </div>

              {/* Station Location Map */}
              <div className="xl:col-span-1">
                <Card title="Station Location">
                  <div className="w-full h-[20rem] sm:h-[24rem] lg:h-[28rem]">
                    <StationMap
                      stationName={currentDevice?.name || "Unknown Station"}
                      location={currentDevice?.location || "Unknown Location"}
                      latitude={
                        currentDevice?.latitude
                          ? parseFloat(currentDevice.latitude)
                          : undefined
                      }
                      longitude={
                        currentDevice?.longitude
                          ? parseFloat(currentDevice.longitude)
                          : undefined
                      }
                      status={currentDevice?.status || "active"}
                    />
                  </div>
                </Card>
              </div>

              {/* Trend Chart */}
              <div className="xl:col-span-2">
                <Card
                  title={displayTitle}
                  right={
                    <div className="relative group">
                      <select
                        value={params[0]}
                        onChange={(e) => setParams([e.target.value])}
                        className="px-4 py-2.5 pr-10 rounded-lg text-sm bg-gradient-to-br from-[#ffffff] to-[#ffffff] border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
                      >
                        {PARAMETERS.map((p) => (
                          <option
                            key={p.key}
                            value={p.key}
                            className="bg-[#e2e8f0] text-slate-800"
                          >
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-blue-600 group-hover:text-blue-600 transition-colors"
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
                      <div className="text-blue-600">Loading chart data...</div>
                    </div>
                  ) : chartError ? (
                    <div className="h-96 flex items-center justify-center">
                      <div className="text-red-600">{chartError}</div>
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
            </div>
          ) : tableLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-blue-600">Loading table data...</div>
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
