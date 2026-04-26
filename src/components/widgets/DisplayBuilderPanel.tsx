import { useState, useEffect } from "react";
import { X, Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { PARAMETERS } from "../../data/constants";
import { getDevices } from "../../services/device.service";
import { createDisplay, updateDisplay, type CustomDisplay, type DisplayWidget } from "../../services/display.service";

interface DisplayBuilderPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingDisplay?: CustomDisplay | null;
}

const WIDGET_TYPES = [
  { type: "gauge" as const, label: "Gauge", description: "Radial gauge for a single parameter", icon: "◎", singleParam: true },
  { type: "parameter_cards" as const, label: "Parameter Cards", description: "Cards with sparkline trends", icon: "⊞", singleParam: false },
  { type: "live_chart" as const, label: "Live Chart", description: "Real-time multi-parameter chart", icon: "📈", singleParam: false },
  { type: "status_board" as const, label: "Status Board", description: "Parameter status grid with indicators", icon: "▣", singleParam: false },
];

export default function DisplayBuilderPanel({ isOpen, onClose, onSaved, editingDisplay }: DisplayBuilderPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [devices, setDevices] = useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [widgets, setWidgets] = useState<DisplayWidget[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Load devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await getDevices({ status: "active" });
        setDevices(data.devices);
        if (data.devices.length > 0 && !editingDisplay) {
          setDeviceId(data.devices[0].id);
        }
      } catch (err) {
        console.error("Failed to load devices:", err);
      }
      setDevicesLoading(false);
    };
    fetchDevices();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editingDisplay) {
      setTitle(editingDisplay.title);
      setDescription(editingDisplay.description || "");
      setSlug(editingDisplay.slug);
      setDeviceId(editingDisplay.deviceId);
      setWidgets((editingDisplay.config as any)?.widgets || []);
      setIsPublic(editingDisplay.isPublic);
      setSlugManuallyEdited(true);
    } else {
      setTitle("");
      setDescription("");
      setSlug("");
      setDeviceId(devices[0]?.id || "");
      setWidgets([]);
      setIsPublic(true);
      setSlugManuallyEdited(false);
    }
  }, [editingDisplay, isOpen]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .substring(0, 80)
      );
    }
  }, [title, slugManuallyEdited]);

  const addWidget = (type: DisplayWidget["type"]) => {
    const widgetType = WIDGET_TYPES.find((w) => w.type === type);
    if (widgetType?.singleParam) {
      setWidgets([...widgets, { type, parameter: PARAMETERS[0].key }]);
    } else {
      setWidgets([...widgets, { type, parameters: [PARAMETERS[0].key] }]);
    }
  };

  const removeWidget = (index: number) => {
    setWidgets(widgets.filter((_, i) => i !== index));
  };

  const updateWidgetParam = (index: number, key: string, value: any) => {
    const updated = [...widgets];
    (updated[index] as any)[key] = value;
    setWidgets(updated);
  };

  const toggleParameter = (widgetIndex: number, paramKey: string) => {
    const widget = widgets[widgetIndex];
    const current = widget.parameters || [];
    if (current.includes(paramKey)) {
      updateWidgetParam(widgetIndex, "parameters", current.filter((p) => p !== paramKey));
    } else {
      updateWidgetParam(widgetIndex, "parameters", [...current, paramKey]);
    }
  };

  const handleSave = async () => {
    setError("");
    if (!title.trim()) { setError("Title is required"); return; }
    if (!slug.trim()) { setError("Slug is required"); return; }
    if (!deviceId) { setError("Please select a device"); return; }
    if (widgets.length === 0) { setError("Add at least one widget"); return; }

    // Validate widgets have params
    for (const w of widgets) {
      if (w.type === "gauge" && !w.parameter) { setError("Gauge widget needs a parameter"); return; }
      if (w.type !== "gauge" && (!w.parameters || w.parameters.length === 0)) {
        setError(`${WIDGET_TYPES.find((t) => t.type === w.type)?.label} needs at least one parameter`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        deviceId,
        slug: slug.trim(),
        isPublic,
        config: { widgets, refreshInterval: 10 },
      };

      if (editingDisplay) {
        await updateDisplay(editingDisplay.id, payload);
      } else {
        await createDisplay(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to save display";
      setError(msg);
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  const shareableUrl = `${window.location.origin}/display/${slug}`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[1000]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-[#0f1a1a] border-l border-white/10 z-[1001] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            {editingDisplay ? "Edit Display" : "Create Display"}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Title */}
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Display Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Pengerang SO₂ Monitor"
              className="w-full px-4 py-2.5 rounded-lg bg-[#0a1414] border border-white/10 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg bg-[#0a1414] border border-white/10 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm text-white/60 mb-1.5">URL Slug *</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
                placeholder="my-display-name"
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#0a1414] border border-white/10 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all font-mono"
              />
            </div>
            {slug && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-teal-400/70">
                <LinkIcon className="w-3 h-3" />
                <span className="truncate">{shareableUrl}</span>
              </div>
            )}
          </div>

          {/* Device */}
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Station / Device *</label>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              disabled={devicesLoading}
              className="w-full px-4 py-2.5 rounded-lg bg-[#0a1414] border border-white/10 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
            >
              {devicesLoading ? (
                <option>Loading...</option>
              ) : (
                devices.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#0a1414]">{d.name} — {d.location}</option>
                ))
              )}
            </select>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-white/70">Public Access</span>
              <p className="text-xs text-white/40 mt-0.5">Anyone with the link can view</p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${isPublic ? "bg-teal-600" : "bg-gray-600"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 ${isPublic ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>

          {/* Divider */}
          <hr className="border-white/10" />

          {/* Widget List */}
          <div>
            <h3 className="text-sm font-medium text-white/70 mb-3">Widgets</h3>

            {widgets.length === 0 && (
              <div className="text-center py-8 text-white/30 text-sm border border-dashed border-white/10 rounded-lg">
                No widgets added yet. Click a widget type below to add one.
              </div>
            )}

            <div className="space-y-3 mb-4">
              {widgets.map((widget, idx) => {
                const meta = WIDGET_TYPES.find((w) => w.type === widget.type);
                return (
                  <div key={idx} className="bg-[#0a1414] border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{meta?.icon}</span>
                        <span className="text-sm text-white font-medium">{meta?.label}</span>
                      </div>
                      <button onClick={() => removeWidget(idx)} className="text-red-400/60 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Single param selector (gauge) */}
                    {meta?.singleParam && (
                      <select
                        value={widget.parameter || ""}
                        onChange={(e) => updateWidgetParam(idx, "parameter", e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-[#0d1717] border border-white/10 text-white text-sm outline-none"
                      >
                        {PARAMETERS.map((p) => (
                          <option key={p.key} value={p.key} className="bg-[#0d1717]">{p.label} ({p.unit})</option>
                        ))}
                      </select>
                    )}

                    {/* Multi param selector */}
                    {!meta?.singleParam && (
                      <div className="flex flex-wrap gap-2">
                        {PARAMETERS.map((p) => {
                          const selected = widget.parameters?.includes(p.key);
                          return (
                            <button
                              key={p.key}
                              onClick={() => toggleParameter(idx, p.key)}
                              className={`px-2.5 py-1 rounded-md text-xs transition-all duration-200 border ${
                                selected
                                  ? "bg-teal-600/20 border-teal-500/50 text-teal-300"
                                  : "bg-transparent border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Widget Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {WIDGET_TYPES.map((wt) => (
                <button
                  key={wt.type}
                  onClick={() => addWidget(wt.type)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-white/10 hover:border-teal-500/40 text-white/50 hover:text-teal-300 transition-all duration-200 text-left"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium">{wt.label}</div>
                    <div className="text-[10px] text-white/30">{wt.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-all text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-all text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : editingDisplay ? "Update Display" : "Create Display"}
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}</style>
    </>
  );
}
