import { useState, useEffect, useMemo } from "react";
import { Plus, Wrench, X, StopCircle, Trash2 } from "lucide-react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import ConfirmDialog from "../../components/modals/ConfirmDialog";
import * as maintenanceService from "../../services/maintenance.service";
import type { MaintenanceLog } from "../../services/maintenance.service";
import { getDevices } from "../../services/device.service";

interface DeviceLite {
  id: string;
  deviceCode: string;
  name: string;
  location: string;
}

const REASONS = [
  "Calibration",
  "Sensor Replacement",
  "Software Update",
  "Routine Inspection",
  "Repair",
  "Other",
];

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const isActive = (log: MaintenanceLog) => {
  const now = Date.now();
  return (
    new Date(log.startTime).getTime() <= now &&
    new Date(log.endTime).getTime() >= now
  );
};

const isUpcoming = (log: MaintenanceLog) =>
  new Date(log.startTime).getTime() > Date.now();

const isPast = (log: MaintenanceLog) =>
  new Date(log.endTime).getTime() < Date.now();

export default function MaintenancePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [devices, setDevices] = useState<DeviceLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formDeviceId, setFormDeviceId] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formReason, setFormReason] = useState(REASONS[0]);
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Confirm dialogs
  const [endDialog, setEndDialog] = useState<{
    open: boolean;
    log: MaintenanceLog | null;
  }>({ open: false, log: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    log: MaintenanceLog | null;
  }>({ open: false, log: null });

  const loadAll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [logsData, devicesResp] = await Promise.all([
        maintenanceService.getAllMaintenance(),
        getDevices({}),
      ]);
      setLogs(logsData);
      setDevices(devicesResp.devices ?? []);
    } catch (err: any) {
      console.error("Failed to load maintenance:", err);
      setError(err?.response?.data?.error ?? "Failed to load maintenance logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const grouped = useMemo(() => {
    return {
      active: logs.filter(isActive),
      upcoming: logs.filter(isUpcoming),
      past: logs.filter(isPast),
    };
  }, [logs]);

  const resetForm = () => {
    setFormDeviceId(devices[0]?.id ?? "");
    setFormStart("");
    setFormEnd("");
    setFormReason(REASONS[0]);
    setFormDescription("");
    setFormError(null);
  };

  const openForm = () => {
    resetForm();
    setShowForm(true);
  };

  const submitForm = async () => {
    setFormError(null);

    if (!formDeviceId) {
      setFormError("Select a device");
      return;
    }
    if (!formStart || !formEnd) {
      setFormError("Both start and end times are required");
      return;
    }
    const startMs = new Date(formStart).getTime();
    const endMs = new Date(formEnd).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      setFormError("Invalid date/time");
      return;
    }
    if (endMs <= startMs) {
      setFormError("End time must be after start time");
      return;
    }

    try {
      setFormSubmitting(true);
      await maintenanceService.createMaintenance(formDeviceId, {
        startTime: new Date(formStart).toISOString(),
        endTime: new Date(formEnd).toISOString(),
        reason: formReason,
        description: formDescription || undefined,
      });
      setShowForm(false);
      await loadAll();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        err?.message ??
        "Failed to create maintenance window";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmEnd = async () => {
    const log = endDialog.log;
    if (!log) return;
    try {
      await maintenanceService.endMaintenanceEarly(log.id);
      setEndDialog({ open: false, log: null });
      await loadAll();
    } catch (err) {
      console.error("Failed to end maintenance:", err);
      setEndDialog({ open: false, log: null });
    }
  };

  const confirmDelete = async () => {
    const log = deleteDialog.log;
    if (!log) return;
    try {
      await maintenanceService.deleteMaintenance(log.id);
      setDeleteDialog({ open: false, log: null });
      await loadAll();
    } catch (err) {
      console.error("Failed to delete maintenance:", err);
      setDeleteDialog({ open: false, log: null });
    }
  };

  const renderRow = (log: MaintenanceLog) => {
    const active = isActive(log);
    const upcoming = isUpcoming(log);
    const deviceLabel =
      log.device?.name ||
      log.device?.deviceCode ||
      devices.find((d) => d.id === log.deviceId)?.name ||
      log.deviceId.slice(0, 8);

    return (
      <div
        key={log.id}
        className="bg-[#ffffff] border border-slate-200 rounded-xl p-4 hover:border-slate-200 transition"
      >
        <div className="flex justify-between items-start mb-3 gap-2">
          <div>
            <h3 className="font-semibold">{deviceLabel}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {log.device?.location ?? ""}
            </p>
          </div>
          {active && (
            <span className="px-2 py-1 rounded text-xs font-medium border bg-blue-500/20 text-blue-600 border-blue-500/30">
              ACTIVE
            </span>
          )}
          {upcoming && (
            <span className="px-2 py-1 rounded text-xs font-medium border bg-amber-500/20 text-amber-600 border-amber-500/30">
              UPCOMING
            </span>
          )}
          {!active && !upcoming && (
            <span className="px-2 py-1 rounded text-xs font-medium border bg-gray-500/20 text-slate-700 border-gray-500/30">
              PAST
            </span>
          )}
        </div>

        <div className="bg-slate-100 rounded-lg p-3 mb-3 text-sm space-y-1">
          <div>
            <span className="text-slate-500">Start: </span>
            {formatDateTime(log.startTime)}
          </div>
          <div>
            <span className="text-slate-500">End: </span>
            {formatDateTime(log.endTime)}
          </div>
          {log.reason && (
            <div>
              <span className="text-slate-500">Reason: </span>
              {log.reason}
            </div>
          )}
          {log.description && (
            <div>
              <span className="text-slate-500">Notes: </span>
              {log.description}
            </div>
          )}
          {log.performedBy && (
            <div>
              <span className="text-slate-500">By: </span>
              {log.performedBy}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {active && (
            <button
              onClick={() => setEndDialog({ open: true, log })}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 transition"
            >
              <StopCircle size={14} />
              End Now
            </button>
          )}
          <button
            onClick={() => setDeleteDialog({ open: true, log })}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-red-500/20 text-red-600 hover:bg-red-500/30 transition"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#ffffff] text-slate-800 overflow-hidden">
      <Sidebar
        active="Maintenance"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          title="Maintenance Management"
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-screen-2xl mx-auto space-y-6">
            <div className="flex items-center">
              <button
                onClick={openForm}
                className="flex text-sm text-black items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                <Plus size={15} />
                Schedule Maintenance
              </button>
              <p className="text-slate-500 pl-4 text-sm mt-1">
                Maintenance windows mark device data as excluded from
                analytics, reports, and alerts.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-600">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12 text-slate-500">
                Loading maintenance logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-[#ffffff] border border-slate-200 rounded-xl text-center">
                <div className="p-4 rounded-full bg-slate-100 mb-4 animate-pulse">
                  <Wrench className="w-8 h-8 text-blue-500/50" />
                </div>
                <h3 className="text-slate-800 font-medium text-lg mb-2">
                  No Maintenance Windows
                </h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                  Schedule a maintenance window to mark device data for
                  exclusion during downtime.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {grouped.active.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold text-blue-600 mb-3">
                      ACTIVE ({grouped.active.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
                      {grouped.active.map(renderRow)}
                    </div>
                  </section>
                )}

                {grouped.upcoming.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold text-amber-600 mb-3">
                      UPCOMING ({grouped.upcoming.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
                      {grouped.upcoming.map(renderRow)}
                    </div>
                  </section>
                )}

                {grouped.past.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold text-slate-700 mb-3">
                      PAST ({grouped.past.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
                      {grouped.past.map(renderRow)}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#ffffff] border border-slate-200 rounded-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Schedule Maintenance</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-slate-700">Device</span>
                <select
                  value={formDeviceId}
                  onChange={(e) => setFormDeviceId(e.target.value)}
                  className="mt-1 w-full bg-[#ffffff] border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">— Select device —</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name || d.deviceCode}
                      {d.location ? ` (${d.location})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-slate-700">Start time</span>
                <input
                  type="datetime-local"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                  className="mt-1 w-full bg-[#ffffff] border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="text-slate-700">End time</span>
                <input
                  type="datetime-local"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                  className="mt-1 w-full bg-[#ffffff] border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="text-slate-700">Reason</span>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="mt-1 w-full bg-[#ffffff] border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-slate-700">Description (optional)</span>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full bg-[#ffffff] border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </label>

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={submitForm}
                disabled={formSubmitting}
                className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-black disabled:opacity-50"
              >
                {formSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={endDialog.open}
        title="End maintenance now?"
        message="This will set the maintenance end time to now. Telemetry collected after this point will be treated as normal data."
        confirmText="End Now"
        onConfirm={confirmEnd}
        onCancel={() => setEndDialog({ open: false, log: null })}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete maintenance log?"
        message="The record will be hidden from all queries but kept for audit. Telemetry from this window will be re-included in analytics and reports."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, log: null })}
      />
    </div>
  );
}
