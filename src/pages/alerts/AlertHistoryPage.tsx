import { useState, useEffect } from "react";
import { CheckCircle, ChevronDown, BellOff } from "lucide-react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import Pagination from "../../components/widgets/Pagination";
import * as alertService from "../../services/alert-history.service";
import type { AlertHistory } from "../../services/alert-history.service";

const parameterLabels: Record<string, string> = {
  so2: "SO₂",
  h2s: "H₂S",
  no2: "NO₂",
  btex: "BTEX",
  temp: "Temperature",
  humidity: "Humidity",
  ws: "Wind Speed",
  wd: "Wind Direction",
  solar: "Solar Radiation",
  rain: "Rain",
};

const severityColors = {
  warning: "bg-yellow-500/20 text-yellow-600",
  critical: "bg-orange-500/20 text-orange-600",
  emergency: "bg-red-500/20 text-red-600",
};

export default function AlertHistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [filter, setFilter] = useState({
    thresholdType: "",
    acknowledged: "",
  });

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await alertService.getAlertHistory({
        thresholdType: filter.thresholdType || undefined,
        acknowledged:
          filter.acknowledged === "true"
            ? true
            : filter.acknowledged === "false"
              ? false
              : undefined,
        limit: 100,
      });
      setAlerts(data);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await alertService.acknowledgeAlert(id);
      await loadAlerts();
    } catch (error: any) {
      alert(
        `Failed to acknowledge alert: ${error.response?.data?.message || error.message}`,
      );
    }
  };

  // Pagination
  const totalPages = Math.ceil(alerts.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedAlerts = alerts.slice(startIdx, startIdx + itemsPerPage);

  return (
    <>
      <style>{`
        .alert-table-scroll::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .alert-table-scroll::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        .alert-table-scroll::-webkit-scrollbar-thumb {
          background: #2563eb;
          border-radius: 4px;
        }
        .alert-table-scroll::-webkit-scrollbar-thumb:hover {
          background: #0d9488;
        }
        .alert-table-scroll {
          scrollbar-width: thin;
          scrollbar-color: #2563eb #1f2937;
        }
      `}</style>

      <div className="flex h-screen bg-[#f1f5f9] text-slate-800 overflow-hidden">
        <Sidebar active="Alert History" isOpen={sidebarOpen} onToggle={setSidebarOpen} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar title="Alert History" onMenuToggle={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              {/* Header & Filters */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h3 className="text-slate-500 mt-2">
                    View and acknowledge triggered alerts
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <select
                      value={filter.thresholdType}
                      onChange={(e) =>
                        setFilter({ ...filter, thresholdType: e.target.value })
                      }
                      className="w-full px-4 py-3 pr-10 rounded-lg bg-[#ffffff] text-sm border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
                    >
                      <option value="">All Severities</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                      <option value="emergency">Emergency</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={filter.acknowledged}
                      onChange={(e) =>
                        setFilter({ ...filter, acknowledged: e.target.value })
                      }
                      className="w-full px-4 py-3 pr-10 rounded-lg bg-[#ffffff] text-sm border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
                    >
                      <option value="">All Status</option>
                      <option value="false">Unacknowledged</option>
                      <option value="true">Acknowledged</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#ffffff] border border-slate-200 rounded-xl p-4">
                  <div className="text-slate-500 text-sm">Total Alerts</div>
                  <div className="text-2xl font-bold mt-1">{alerts.length}</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <div className="text-yellow-600 text-sm">Warning</div>
                  <div className="text-2xl font-bold mt-1 text-yellow-600">
                    {alerts.filter((a) => a.thresholdType === "warning").length}
                  </div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                  <div className="text-orange-600 text-sm">Critical</div>
                  <div className="text-2xl font-bold mt-1 text-orange-600">
                    {
                      alerts.filter((a) => a.thresholdType === "critical")
                        .length
                    }
                  </div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="text-red-600 text-sm">Emergency</div>
                  <div className="text-2xl font-bold mt-1 text-red-600">
                    {
                      alerts.filter((a) => a.thresholdType === "emergency")
                        .length
                    }
                  </div>
                </div>
              </div>

              {/* Alerts Table or Empty State */}
              {!isLoading && alerts.length === 0 ? (
                <div className="bg-[#ffffff] border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-5 animate-pulse">
                    <BellOff className="w-8 h-8 text-blue-500/50" />
                  </div>
                  <h3 className="text-slate-800 font-medium text-lg mb-2">
                    No Alert History Yet
                  </h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mb-4">
                    Set up alert thresholds to get notified when parameter
                    values exceed safe limits.
                  </p>
                </div>
              ) : (
                <div className="bg-[#ffffff] border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto alert-table-scroll">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                            Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                            Device
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                            Parameter
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                            Value
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                            Threshold
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                            Severity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-8 text-center text-slate-500"
                            >
                              Loading alerts...
                            </td>
                          </tr>
                        ) : (
                          paginatedAlerts.map((alert) => (
                            <tr
                              key={alert.id}
                              className="border-b border-slate-200 hover:bg-slate-100 transition"
                            >
                              <td className="px-4 py-3 text-sm whitespace-nowrap">
                                {new Date(alert.observedAt).toLocaleString(
                                  "en-MY",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "short",
                                    hour12: false,
                                  },
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm whitespace-nowrap">
                                {alert.device.name}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                                {parameterLabels[alert.parameter] ||
                                  alert.parameter}
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-blue-600 whitespace-nowrap">
                                {Number(alert.actualValue).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                                {alert.threshold.operator}{" "}
                                {Number(alert.thresholdValue).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    severityColors[alert.thresholdType]
                                  }`}
                                >
                                  {alert.thresholdType.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm whitespace-nowrap">
                                {alert.acknowledged ? (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle size={14} />
                                    Acknowledged
                                  </span>
                                ) : (
                                  <span className="text-yellow-600">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {!alert.acknowledged && (
                                  <button
                                    onClick={() => handleAcknowledge(alert.id)}
                                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition"
                                  >
                                    Acknowledge
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="border-t border-slate-200 p-4">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        startIndex={startIdx}
                        endIndex={Math.min(
                          startIdx + itemsPerPage,
                          alerts.length,
                        )}
                        totalItems={alerts.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
