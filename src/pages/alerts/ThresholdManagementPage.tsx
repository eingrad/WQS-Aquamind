import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Power, PowerOff, BellOff } from "lucide-react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import ThresholdForm from "../../components/alerts/ThresholdForm";
import ConfirmDialog from "../../components/modals/ConfirmDialog";
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
  rain: "Rain",
};

const severityColors = {
  warning: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  critical: "bg-orange-500/20 text-orange-600 border-orange-500/30",
  emergency: "bg-red-500/20 text-red-600 border-red-500/30",
};

export default function ThresholdManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingThreshold, setEditingThreshold] =
    useState<AlertThreshold | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    thresholdId: string;
    thresholdName: string;
  }>({ isOpen: false, thresholdId: "", thresholdName: "" });

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

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({ isOpen: true, thresholdId: id, thresholdName: name });
  };

  const confirmDelete = async () => {
    const { thresholdId } = deleteDialog;

    try {
      await thresholdService.deleteThreshold(thresholdId);
      setDeleteDialog({ isOpen: false, thresholdId: "", thresholdName: "" });
      await loadThresholds();
    } catch (error) {
      console.error("Failed to delete threshold:", error);
      setDeleteDialog({ isOpen: false, thresholdId: "", thresholdName: "" });
    }
  };

  return (
    <div className="flex h-screen bg-[#ffffff] text-slate-800 overflow-hidden">
      <Sidebar active="Alert Thresholds" isOpen={sidebarOpen} onToggle={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Alert Threshold Management" onMenuToggle={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-screen-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  setEditingThreshold(null);
                  setShowForm(true);
                }}
                className="flex text-sm text-black items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                <Plus size={15} />
                Add Threshold
              </button>

              <div>
                <p className="text-slate-500 pl-4 text-sm mt-1">
                  Configure global alert thresholds for monitoring parameters
                </p>
              </div>
            </div>

            {/* Thresholds Grid */}
            {isLoading ? (
              <div className="text-center py-12 text-slate-500">
                Loading thresholds...
              </div>
            ) : thresholds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-[#ffffff] border border-slate-200 rounded-xl text-center">
                <div className="p-4 rounded-full bg-slate-100 mb-4 animate-pulse">
                  <BellOff className="w-8 h-8 text-blue-500/50" />
                </div>
                <h3 className="text-slate-800 font-medium text-lg mb-2">
                  No Thresholds Configured
                </h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                  Set up alert thresholds to get notified when parameter values
                  exceed safe limits.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
                {thresholds.map((threshold) => (
                  <div
                    key={threshold.id}
                    className="bg-[#ffffff] border border-slate-200 rounded-xl p-4 hover:border-slate-200 transition"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {parameterLabels[threshold.parameter] ||
                            threshold.parameter}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
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
                    <div className="bg-slate-100 rounded-lg p-3 mb-3">
                      <div className="text-2xl font-bold text-blue-600">
                        {threshold.operator} {threshold.value}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
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
                            ? "bg-blue-600/20 text-blue-600 hover:bg-blue-600/30"
                            : "bg-gray-600/20 text-slate-500 hover:bg-gray-600/30"
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
                        className="p-2 bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(
                            threshold.id,
                            `${parameterLabels[threshold.parameter] || threshold.parameter} (${threshold.thresholdType})`,
                          )
                        }
                        className="p-2 bg-red-500/20 text-red-600 hover:bg-red-500/30 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Creator Info */}
                    <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-slate-200">
                      Created by {threshold.creator.fullName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Form Modal */}
      {showForm && (
        <ThresholdForm
          threshold={editingThreshold}
          onClose={() => {
            setShowForm(false);
            setEditingThreshold(null);
          }}
          onSuccess={loadThresholds}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Threshold"
        message={`Are you sure you want to delete the threshold "${deleteDialog.thresholdName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteDialog({ isOpen: false, thresholdId: "", thresholdName: "" })
        }
      />
    </div>
  );
}
