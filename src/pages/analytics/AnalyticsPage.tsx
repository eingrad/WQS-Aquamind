import { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import Card from "../../components/widgets/Card";
import AnalyticsChart from "../../components/charts/AnalyticsChart";
import AnalyticsControls from "../../components/widgets/AnalyticsControl";
import EmptyState from "../../components/common/EmptyState";
import { getDevices } from "../../services/device.service";
import { getTimeSeriesData } from "../../services/telemetry.service";
import { PARAMETERS } from "../../data/constants";
import { useUnits } from "../../context/UnitContext";

const TIME_AVERAGES = [
  { value: "30m", label: "30 Minute Avg" },
  { value: "1h", label: "1 Hour Avg" },
  { value: "8h", label: "8 Hour Avg" },
  { value: "24h", label: "24 Hour Avg" },
] as const;

type TimeAverage = (typeof TIME_AVERAGES)[number]["value"];

const LOOKBACK_MS: Record<TimeAverage, number> = {
  "30m": 7 * 24 * 60 * 60 * 1000,
  "1h": 7 * 24 * 60 * 60 * 1000,
  "8h": 30 * 24 * 60 * 60 * 1000,
  "24h": 90 * 24 * 60 * 60 * 1000,
};

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { convert, getUnit } = useUnits();

  const [devices, setDevices] = useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [device, setDevice] = useState("");

  const [selectedParams, setSelectedParams] = useState<string[]>(["ph"]);
  const [timeAverage, setTimeAverage] = useState<TimeAverage>("1h");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");

  // undefined = not yet fetched, null = fetched but no timestamp
  const [latestDataTime, setLatestDataTime] = useState<Date | null | undefined>(
    undefined,
  );

  // ─── Derived state ──────────────────────────────────────────────────────────

  const chartTitle = useMemo(() => {
    if (selectedParams.length === 1) {
      const meta = PARAMETERS.find((p) => p.key === selectedParams[0]);
      return meta ? `${meta.label} (${getUnit(meta.key)})` : selectedParams[0];
    }
    return `${selectedParams.length} Parameters Selected`;
  }, [selectedParams, getUnit]);

  const avgLabel = useMemo(
    () => TIME_AVERAGES.find((t) => t.value === timeAverage)?.label ?? "",
    [timeAverage],
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const toggleParam = useCallback((key: string) => {
    setSelectedParams((prev) => {
      if (prev.includes(key))
        return prev.length === 1 ? prev : prev.filter((p) => p !== key);
      return [...prev, key];
    });
  }, []);

  const selectAllParams = useCallback(
    () => setSelectedParams(PARAMETERS.map((p) => p.key)),
    [],
  );
  const deselectAllParams = useCallback(() => setSelectedParams(["ph"]), []);

  // ─── Effects ────────────────────────────────────────────────────────────────

  // Fetch devices once on mount
  useEffect(() => {
    const run = async () => {
      try {
        setDevicesLoading(true);
        const data = await getDevices({ status: "active" });
        setDevices(data.devices);
        if (data.devices.length > 0) setDevice(data.devices[0].id);
      } catch (err) {
        console.error("Failed to fetch devices:", err);
        setChartError("Failed to load devices");
      } finally {
        setDevicesLoading(false);
      }
    };
    run();
  }, []);

  // Fetch latest timestamp whenever device changes
  useEffect(() => {
    if (!device) return;
    setLatestDataTime(undefined); // reset while fetching

    const run = async () => {
      try {
        const { getDeviceStatus } =
          await import("../../services/deviceStatus.service");
        const status = await getDeviceStatus(device);
        setLatestDataTime(
          status.latestTimestamp ? new Date(status.latestTimestamp) : null,
        );
      } catch (err) {
        console.error("Failed to fetch device status:", err);
        setLatestDataTime(null);
      }
    };
    run();
  }, [device]);

  // Fetch chart data — wait until latestDataTime is resolved
  useEffect(() => {
    if (!device || selectedParams.length === 0 || latestDataTime === undefined)
      return;

    const run = async () => {
      try {
        setChartLoading(true);
        setChartError("");

        let startTime: Date;
        let endTime: Date;

        if (startDate && endDate) {
          const now = new Date();
          startTime = new Date(startDate + "T00:00:00.000Z");
          const selectedEnd = new Date(endDate + "T23:59:59.999Z");
          endTime = selectedEnd > now ? now : selectedEnd;
        } else {
          const anchor = latestDataTime ?? new Date();
          endTime = anchor;
          startTime = new Date(anchor.getTime() - LOOKBACK_MS[timeAverage]);
        }

        const data = await getTimeSeriesData({
          deviceId: device,
          startDate: startTime.toISOString(),
          endDate: endTime.toISOString(),
          interval: timeAverage,
          parameters: selectedParams.join(","),
        });

        const transformed = data.timeSeries.map((item: any) => {
          // Per-parameter maintenance map. Always emit every parameter's
          // value — AnalyticsChart renders maintenance points on a
          // separate dashed trace so the line stays continuous while
          // still being visually distinguishable.
          const paramMaint: Record<string, boolean> =
            item.parameter_in_maintenance || {};
          const anySelectedInMaintenance = selectedParams.some(
            (p) => paramMaint[p],
          );

          const point: any = {
            t: new Date(item.bucket).getTime(),
            inMaintenance: anySelectedInMaintenance,
            paramInMaintenance: paramMaint,
          };

          selectedParams.forEach((param) => {
            const key = `${param}_avg`;
            if (item[key] != null) {
              const raw = parseFloat(item[key]);
              point[param] = convert(raw, param) ?? raw;
            }
          });
          return point;
        });

        // Drop trailing empty buckets (O(n), computed once). Maintenance
        // points count as "has data" so the band still renders.
        const lastWithData = transformed.reduce(
          (last: number, point: any, idx: number) => {
            const hasData =
              selectedParams.some((p) => point[p] != null) ||
              point.inMaintenance;
            return hasData ? idx : last;
          },
          0,
        );

        setChartData(transformed.slice(0, lastWithData + 1).reverse());
      } catch (err) {
        console.error("Failed to fetch analytics data:", err);
        setChartError("Failed to load analytics data");
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };
    run();
  }, [
    device,
    selectedParams,
    timeAverage,
    startDate,
    endDate,
    convert,
    latestDataTime,
  ]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex bg-[#ffffff] min-h-screen text-slate-700 overflow-x-hidden min-w-0">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 10px; width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2563eb; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0d9488; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #474747ff #1f2937; }
        /* Prevent Plotly unified hover tooltip from being clipped */
        .js-plotly-plot .plotly .main-svg { overflow: visible !important; }
        .js-plotly-plot .plotly .svg-container { overflow: visible !important; }
        .js-plotly-plot .plot-container.plotly { overflow: visible !important; }
      `}</style>

      <Sidebar
        active="Analytics"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title="Analytics" onMenuToggle={() => setSidebarOpen(true)} />

        <AnalyticsControls
          devices={devices}
          devicesLoading={devicesLoading}
          device={device}
          onDeviceChange={setDevice}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          timeAverage={timeAverage}
          onTimeAverageChange={setTimeAverage}
          selectedParams={selectedParams}
          onToggleParam={toggleParam}
          onSelectAll={selectAllParams}
          onDeselectAll={deselectAllParams}
          getUnit={getUnit}
        />

        <div className="flex-1 p-6 min-w-0">
          <Card title={`${chartTitle} | ${avgLabel}`}>
            {chartLoading ? (
              <div className="h-[650px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-blue-600 text-sm">
                    Loading analytics data...
                  </span>
                </div>
              </div>
            ) : chartError ? (
              <div className="h-[650px] flex items-center justify-center">
                <div className="text-red-600">{chartError}</div>
              </div>
            ) : chartData.length === 0 ? (
              <EmptyState
                title="No Data Available"
                message="Try adjusting your date range or parameters"
              />
            ) : (
              <div className="h-[650px] overflow-visible">
                <AnalyticsChart data={chartData} params={selectedParams} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
