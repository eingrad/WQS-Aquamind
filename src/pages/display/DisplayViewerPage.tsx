import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UnitProvider } from "../../context/UnitContext";
import { getDisplayBySlug, type CustomDisplay, type DisplayWidget } from "../../services/display.service";
import GaugeWidget from "../../components/display/GaugeWidget";
import ParameterCardsWidget from "../../components/display/ParameterCardsWidget";
import LiveChartWidget from "../../components/display/LiveChartWidget";
import StatusBoardWidget from "../../components/display/StatusBoardWidget";

function DisplayViewerContent() {
  const { slug } = useParams<{ slug: string }>();
  const [display, setDisplay] = useState<CustomDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!slug) return;

    const fetchDisplay = async () => {
      try {
        const data = await getDisplayBySlug(slug);
        setDisplay(data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setError("Display not found");
        } else if (err?.response?.status === 403) {
          setError("This display is not public");
        } else {
          setError("Failed to load display");
        }
      }
      setLoading(false);
    };

    fetchDisplay();
  }, [slug]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderWidget = (widget: DisplayWidget, index: number) => {
    if (!display) return null;
    const deviceId = display.deviceId;

    switch (widget.type) {
      case "gauge":
        return (
          <div key={index} className="col-span-1">
            <GaugeWidget deviceId={deviceId} parameter={widget.parameter || "so2"} />
          </div>
        );
      case "parameter_cards":
        return (
          <div key={index} className="col-span-full">
            <ParameterCardsWidget deviceId={deviceId} parameters={widget.parameters || []} />
          </div>
        );
      case "live_chart":
        return (
          <div key={index} className="col-span-full">
            <LiveChartWidget deviceId={deviceId} parameters={widget.parameters || []} />
          </div>
        );
      case "status_board":
        return (
          <div key={index} className="col-span-full">
            <StatusBoardWidget deviceId={deviceId} parameters={widget.parameters || []} />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1010] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-white/50 text-sm">Loading display...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a1010] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h1 className="text-xl font-semibold text-white mb-2">{error}</h1>
          <p className="text-white/40 text-sm">
            Check the display link and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!display) return null;

  const config = display.config as any;
  const widgets: DisplayWidget[] = config?.widgets || [];

  // Count gauge widgets to determine grid columns
  const gaugeWidgets = widgets.filter((w) => w.type === "gauge");
  const gaugeCols = gaugeWidgets.length <= 2 ? 2 : gaugeWidgets.length <= 4 ? 4 : 4;

  return (
    <div className="min-h-screen bg-[#0a1010] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0d1414]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">{display.title}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              {display.device && (
                <span className="text-xs text-white/40">
                  📍 {display.device.name} — {display.device.location}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/40">LIVE</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-white/70 tabular-nums">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-[10px] text-white/30">
                {currentTime.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Widgets Grid */}
      <main className="max-w-7xl mx-auto p-6">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${gaugeCols} gap-6`}>
          {widgets.map((widget, index) => renderWidget(widget, index))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-white/20">
          PETRONAS Monitoring System • Auto-refreshing every 10s
        </div>
      </main>
    </div>
  );
}

export default function DisplayViewerPage() {
  return (
    <UnitProvider>
      <DisplayViewerContent />
    </UnitProvider>
  );
}
