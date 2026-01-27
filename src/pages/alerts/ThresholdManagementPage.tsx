import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import * as thresholdService from "../../services/alert-threshold.service";
import type { AlertThreshold } from "../../services/alert-threshold.service";

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
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  critical: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  emergency: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ThresholdManagementPage() {
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingThreshold, setEditingThreshold] =
    useState<AlertThreshold | null>(null);

  useEffect(() => {
    loadThresholds();
  }, []);

  const loadThresholds = async () => {
    try {
      setIsLoading(true);
      const data = await thresholdService.getThresholds();
      setThresholds(data);
    } catch (error) {
      console.error("Failed to load thresholds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      await thresholdService.toggleThreshold(id, !currentState);
      await loadThresholds();
    } catch (error) {
      console.error("Failed to toggle threshold:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this threshold?")) return;

    try {
      await thresholdService.deleteThreshold(id);
      await loadThresholds();
    } catch (error) {
      console.error("Failed to delete threshold:", error);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0f0f] text-white overflow-hidden">
      <Sidebar active="Alert Thresholds" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Alert Threshold Management" />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">Alert Thresholds</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Configure global alert thresholds for monitoring parameters
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingThreshold(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition"
              >
                <Plus size={18} />
                Add Threshold
              </button>
            </div>

            {/* Thresholds Grid */}
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">
                Loading thresholds...
              </div>
            ) : thresholds.length === 0 ? (
              <div className="bg-[#121b1b] border border-white/5 rounded-xl p-12 text-center">
                <p className="text-gray-400 mb-4">
                  No thresholds configured yet
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-teal-400 hover:text-teal-300 underline"
                >
                  Create your first threshold
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {thresholds.map((threshold) => (
                  <div
                    key={threshold.id}
                    className="bg-[#121b1b] border border-white/5 rounded-xl p-4 hover:border-white/10 transition"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {parameterLabels[threshold.parameter] ||
                            threshold.parameter}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {threshold.device?.name || "All Devices"}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          severityColors[threshold.thresholdType]
                        }`}
                      >
                        {threshold.thresholdType.toUpperCase()}
                      </span>
                    </div>

                    {/* Threshold Value */}
                    <div className="bg-white/5 rounded-lg p-3 mb-3">
                      <div className="text-2xl font-bold text-teal-400">
                        {threshold.operator} {threshold.value}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Cooldown: {threshold.cooldownMinutes} minutes
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleToggle(threshold.id, threshold.enabled)
                        }
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                          threshold.enabled
                            ? "bg-teal-600/20 text-teal-400 hover:bg-teal-600/30"
                            : "bg-gray-600/20 text-gray-400 hover:bg-gray-600/30"
                        }`}
                        title={threshold.enabled ? "Disable" : "Enable"}
                      >
                        {threshold.enabled ? (
                          <>
                            <Power size={14} />
                            Enabled
                          </>
                        ) : (
                          <>
                            <PowerOff size={14} />
                            Disabled
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setEditingThreshold(threshold);
                          setShowForm(true);
                        }}
                        className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(threshold.id)}
                        className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Creator Info */}
                    <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-white/5">
                      Created by {threshold.creator.fullName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Form Modal - Placeholder for now */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121b1b] border border-white/10 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              {editingThreshold ? "Edit Threshold" : "Create Threshold"}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Form component will be implemented next...
            </p>
            <button
              onClick={() => setShowForm(false)}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
