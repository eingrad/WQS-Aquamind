import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
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
  pressure: "Pressure",
  rain: "Rain",
};

const severityColors = {
  warning: "bg-yellow-500/20 text-yellow-400",
  critical: "bg-orange-500/20 text-orange-400",
  emergency: "bg-red-500/20 text-red-400",
};

export default function AlertHistoryPage() {
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
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  // Pagination
  const totalPages = Math.ceil(alerts.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedAlerts = alerts.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="flex h-screen bg-[#0a0f0f] text-white overflow-hidden">
      <Sidebar active="Alert History" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Alert History" />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header & Filters */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Alert History</h2>
                <p className="text-gray-400 text-sm mt-1">
                  View and acknowledge triggered alerts
                </p>
              </div>

              <div className="flex gap-3">
                <select
                  value={filter.thresholdType}
                  onChange={(e) =>
                    setFilter({ ...filter, thresholdType: e.target.value })
                  }
                  className="px-4 py-2 bg-[#121b1b] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="">All Severities</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                  <option value="emergency">Emergency</option>
                </select>

                <select
                  value={filter.acknowledged}
                  onChange={(e) =>
                    setFilter({ ...filter, acknowledged: e.target.value })
                  }
                  className="px-4 py-2 bg-[#121b1b] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="">All Status</option>
                  <option value="false">Unacknowledged</option>
                  <option value="true">Acknowledged</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#121b1b] border border-white/5 rounded-xl p-4">
                <div className="text-gray-400 text-sm">Total Alerts</div>
                <div className="text-2xl font-bold mt-1">{alerts.length}</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="text-yellow-400 text-sm">Warning</div>
                <div className="text-2xl font-bold mt-1 text-yellow-400">
                  {alerts.filter((a) => a.thresholdType === "warning").length}
                </div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <div className="text-orange-400 text-sm">Critical</div>
                <div className="text-2xl font-bold mt-1 text-orange-400">
                  {alerts.filter((a) => a.thresholdType === "critical").length}
                </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="text-red-400 text-sm">Emergency</div>
                <div className="text-2xl font-bold mt-1 text-red-400">
                  {alerts.filter((a) => a.thresholdType === "emergency").length}
                </div>
              </div>
            </div>

            {/* Alerts Table */}
            <div className="bg-[#121b1b] border border-white/5 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Device
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Parameter
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Threshold
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Severity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          Loading alerts...
                        </td>
                      </tr>
                    ) : paginatedAlerts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          No alerts found
                        </td>
                      </tr>
                    ) : (
                      paginatedAlerts.map((alert) => (
                        <tr
                          key={alert.id}
                          className="border-b border-white/5 hover:bg-white/5 transition"
                        >
                          <td className="px-4 py-3 text-sm">
                            {new Date(alert.observedAt).toLocaleString(
                              "en-MY",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "short",
                              },
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {alert.device.name}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {parameterLabels[alert.parameter] ||
                              alert.parameter}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-teal-400">
                            {alert.actualValue.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {alert.threshold.operator} {alert.thresholdValue}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                severityColors[alert.thresholdType]
                              }`}
                            >
                              {alert.thresholdType.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {alert.acknowledged ? (
                              <span className="text-green-400 flex items-center gap-1">
                                <CheckCircle size={14} />
                                Acknowledged
                              </span>
                            ) : (
                              <span className="text-yellow-400">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {!alert.acknowledged && (
                              <button
                                onClick={() => handleAcknowledge(alert.id)}
                                className="px-3 py-1 text-xs bg-teal-600 hover:bg-teal-700 rounded transition"
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
                <div className="border-t border-white/5 p-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    startIndex={startIdx}
                    endIndex={Math.min(startIdx + itemsPerPage, alerts.length)}
                    totalItems={alerts.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
