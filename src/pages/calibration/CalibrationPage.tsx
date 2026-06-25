import { useState, useEffect } from "react";
import { SlidersHorizontal, Check, RotateCcw } from "lucide-react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import { getDevices } from "../../services/device.service";
import {
  getCalibration,
  updateCalibration,
  type CalibrationEntry,
  type CalibrationOperation,
} from "../../services/calibration.service";

const PARAM_META: Record<string, { label: string; unit: string }> = {
  ph: { label: "pH", unit: "pH" },
  do: { label: "Dissolved Oxygen", unit: "mg/L" },
  nh3n: { label: "NH₃-N", unit: "mg/L" },
  cod: { label: "COD", unit: "mg/L" },
  bod: { label: "BOD", unit: "mg/L" },
  tss: { label: "TSS", unit: "mg/L" },
  temperature: { label: "Temperature", unit: "°C" },
  depth: { label: "Depth", unit: "m" },
};

const OPERATIONS: {
  key: CalibrationOperation;
  label: string;
  symbol: string;
}[] = [
  { key: "none", label: "None", symbol: "—" },
  { key: "multiply", label: "Multiply", symbol: "×" },
  { key: "divide", label: "Divide", symbol: "÷" },
  { key: "add", label: "Add", symbol: "+" },
  { key: "subtract", label: "Subtract", symbol: "−" },
];

const SYMBOL: Record<CalibrationOperation, string> = {
  none: "",
  multiply: "×",
  divide: "÷",
  add: "+",
  subtract: "−",
};

const applyOp = (
  raw: number,
  op: CalibrationOperation,
  value: number,
): number => {
  switch (op) {
    case "multiply":
      return raw * value;
    case "divide":
      return value !== 0 ? raw / value : raw;
    case "add":
      return raw + value;
    case "subtract":
      return raw - value;
    default:
      return raw;
  }
};

type RowEdit = { operation: CalibrationOperation; value: string; test: string };

export default function CalibrationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [entries, setEntries] = useState<CalibrationEntry[]>([]);
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [loading, setLoading] = useState(true);
  const [savingParam, setSavingParam] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDevices({ status: "active" });
        setDevices(data.devices);
        if (data.devices.length > 0) setDeviceId(data.devices[0].id);
      } catch (e) {
        console.error("Failed to load devices", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (deviceId) loadCalibration(deviceId);
  }, [deviceId]);

  const loadCalibration = async (id: string) => {
    try {
      setLoading(true);
      const data = await getCalibration(id);
      setEntries(data);
      const e: Record<string, RowEdit> = {};
      data.forEach((row) => {
        e[row.parameter] = {
          operation: row.operation,
          value: row.operation === "none" ? "" : String(row.value),
          test: "",
        };
      });
      setEdits(e);
    } catch (err) {
      console.error("Failed to load calibration", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const setEdit = (param: string, patch: Partial<RowEdit>) =>
    setEdits((prev) => ({ ...prev, [param]: { ...prev[param], ...patch } }));

  const isDirty = (row: CalibrationEntry) => {
    const e = edits[row.parameter];
    if (!e) return false;
    if (e.operation !== row.operation) return true;
    if (e.operation === "none") return false;
    return Number(e.value) !== row.value;
  };

  const save = async (
    param: string,
    operation: CalibrationOperation,
    value: number,
  ) => {
    if (operation !== "none") {
      if (!Number.isFinite(value)) {
        showToast("Enter a valid number");
        return;
      }
      if ((operation === "multiply" || operation === "divide") && value === 0) {
        showToast(`Value must be non-zero for ${operation}`);
        return;
      }
    }
    try {
      setSavingParam(param);
      await updateCalibration({ deviceId, parameter: param, operation, value });
      await loadCalibration(deviceId);
      showToast(`${PARAM_META[param]?.label ?? param} calibration saved`);
    } catch (err: any) {
      showToast(err?.response?.data?.error ?? "Failed to save");
    } finally {
      setSavingParam(null);
    }
  };

  const handleSave = (param: string) => {
    const e = edits[param];
    save(param, e.operation, Number(e.value));
  };

  const handleReset = (param: string) => save(param, "none", 0);

  const preview = (param: string): number | null => {
    const e = edits[param];
    if (!e) return null;
    if (e.test === "") return null;
    const raw = Number(e.test);
    if (!Number.isFinite(raw)) return null;
    if (e.operation === "none") return raw;
    const v = Number(e.value);
    if (!Number.isFinite(v)) return null;
    return applyOp(raw, e.operation, v);
  };

  return (
    <div className="flex h-screen bg-[#ffffff] text-slate-800 overflow-hidden">
      <Sidebar
        active="Calibration"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          title="Sensor Calibration"
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="w-full space-y-6">
            {/* Header + device selector */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <SlidersHorizontal className="w-5 h-5" />
                  </span>
                  Sensor Calibration
                </h2>
                <p className="text-slate-500 text-sm mt-2 max-w-2xl">
                  Adjust each incoming parameter with an operation and a value.
                  Applied to new readings before they are stored, alerted on,
                  fed to WQI and shown on the dashboard. Choose{" "}
                  <span className="font-medium">None</span> to leave a parameter
                  unchanged.
                </p>
              </div>
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full sm:w-auto sm:shrink-0 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.deviceCode})
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500">
                Loading calibration...
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((row) => {
                  const meta = PARAM_META[row.parameter] ?? {
                    label: row.parameter,
                    unit: "",
                  };
                  const e = edits[row.parameter];
                  if (!e) return null;
                  const previewVal = preview(row.parameter);
                  const dirty = isDirty(row);
                  const isNone = e.operation === "none";

                  return (
                    <div
                      key={row.parameter}
                      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm"
                    >
                      {/* Title row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-semibold text-slate-800">
                            {meta.label}
                          </h3>
                          <span className="text-xs text-slate-400">
                            {meta.unit}
                          </span>
                        </div>
                        {row.isCalibrated ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Calibrated
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 px-2.5 py-1">
                            Not calibrated
                          </span>
                        )}
                      </div>

                      {/* Operation segmented control */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3">
                        {OPERATIONS.map((op) => {
                          const active = e.operation === op.key;
                          return (
                            <button
                              key={op.key}
                              onClick={() =>
                                setEdit(row.parameter, {
                                  operation: op.key,
                                  value: op.key === "none" ? "" : e.value || "",
                                })
                              }
                              className={`flex items-center justify-center px-2 py-1.5 rounded-lg text-sm font-medium border transition ${
                                active
                                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <span className="font-mono mr-1">
                                {op.symbol}
                              </span>
                              {op.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Value + preview + actions */}
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        {/* Value input */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-slate-500 w-16 lg:w-auto shrink-0">
                            Value
                          </label>
                          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30">
                            <span className="px-2 text-slate-400 font-mono bg-slate-50 border-r border-slate-200 py-1.5 w-8 text-center shrink-0">
                              {SYMBOL[e.operation] || "·"}
                            </span>
                            <input
                              type="number"
                              step="any"
                              disabled={isNone}
                              value={e.value}
                              onChange={(ev) =>
                                setEdit(row.parameter, {
                                  value: ev.target.value,
                                })
                              }
                              placeholder={isNone ? "—" : "0"}
                              className="w-full lg:w-24 px-2 py-1.5 font-mono outline-none disabled:bg-slate-50 disabled:text-slate-300"
                            />
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500 w-16 lg:w-auto shrink-0">
                            Preview
                          </span>
                          <input
                            type="number"
                            step="any"
                            placeholder="raw"
                            value={e.test}
                            onChange={(ev) =>
                              setEdit(row.parameter, { test: ev.target.value })
                            }
                            className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 font-mono"
                          />
                          <span className="text-slate-400">→</span>
                          <span className="font-mono font-medium text-slate-800 flex-1 lg:flex-none lg:w-20">
                            {previewVal === null ? "—" : previewVal.toFixed(3)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 lg:ml-auto">
                          {row.updatedAt && (
                            <span className="hidden xl:block text-xs text-slate-400 mr-1">
                              {new Date(row.updatedAt).toLocaleString()}
                            </span>
                          )}
                          {row.isCalibrated && (
                            <button
                              title="Reset to None"
                              onClick={() => handleReset(row.parameter)}
                              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                          <button
                            disabled={!dirty || savingParam === row.parameter}
                            onClick={() => handleSave(row.parameter)}
                            className="flex flex-1 lg:flex-none items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                          >
                            <Check size={15} />
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[1080] bg-slate-800 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
