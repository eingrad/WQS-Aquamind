import { useState, useEffect } from "react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import DisplayBuilderPanel from "../../components/widgets/DisplayBuilderPanel";
import ConfirmDialog from "../../components/modals/ConfirmDialog";
import { listDisplays, deleteDisplay, type CustomDisplay } from "../../services/display.service";
import { Plus, ExternalLink, Copy, Pencil, Trash2, Monitor, Check } from "lucide-react";

export default function DisplayBuilderPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [displays, setDisplays] = useState<CustomDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingDisplay, setEditingDisplay] = useState<CustomDisplay | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomDisplay | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const fetchDisplays = async () => {
    try {
      setLoading(true);
      const data = await listDisplays();
      setDisplays(data);
    } catch (err) {
      console.error("Failed to load displays:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDisplays();
  }, []);

  const handleCreate = () => {
    setEditingDisplay(null);
    setPanelOpen(true);
  };

  const handleEdit = (display: CustomDisplay) => {
    setEditingDisplay(display);
    setPanelOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDisplay(deleteTarget.id);
      setDeleteTarget(null);
      fetchDisplays();
    } catch (err) {
      console.error("Failed to delete display:", err);
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/display/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const getWidgetSummary = (display: CustomDisplay) => {
    const config = display.config as any;
    const widgets = config?.widgets || [];
    const types = widgets.map((w: any) => {
      switch (w.type) {
        case "gauge": return "Gauge";
        case "parameter_cards": return "Cards";
        case "live_chart": return "Chart";
        case "status_board": return "Status";
        default: return w.type;
      }
    });
    return types.join(" · ") || "No widgets";
  };

  return (
    <div className="flex bg-[#0f1a1a] min-h-screen text-gray-100 overflow-x-hidden min-w-0">
      <Sidebar active="Displays" isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title="Custom Displays" onMenuToggle={() => setSidebarOpen(true)} />

        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Display Builder</h1>
              <p className="text-white/40 text-sm mt-1">
                Create custom monitoring displays with shareable links
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-lg shadow-teal-500/20"
            >
              <Plus className="w-4 h-4" />
              Create Display
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#0d1717] border border-white/10 rounded-xl p-6 animate-pulse h-[200px]" />
              ))}
            </div>
          ) : displays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
                <Monitor className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Displays Yet</h3>
              <p className="text-white/40 text-sm mb-6 max-w-sm">
                Create your first custom display to monitor parameters in real-time with a shareable link.
              </p>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Display
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displays.map((display) => (
                <div
                  key={display.id}
                  className="bg-gradient-to-br from-[#0d1717] to-[#0a1414] border border-white/10 rounded-xl overflow-hidden group hover:border-teal-500/30 transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-3">
                        <h3 className="text-white font-semibold text-base truncate">{display.title}</h3>
                        {display.description && (
                          <p className="text-white/40 text-xs mt-1 line-clamp-2">{display.description}</p>
                        )}
                      </div>
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${display.isPublic ? "bg-emerald-400" : "bg-amber-400"}`} title={display.isPublic ? "Public" : "Private"} />
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span className="text-white/20">Station:</span>
                        <span className="text-white/60">{display.device?.name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span className="text-white/20">Widgets:</span>
                        <span className="text-white/60">{getWidgetSummary(display)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span className="text-white/20">Created:</span>
                        <span className="text-white/60">
                          {new Date(display.createdAt).toLocaleDateString()} by {display.creator?.fullName || "Unknown"}
                        </span>
                      </div>
                    </div>

                    {/* Slug / Link */}
                    <div className="flex items-center gap-2 bg-[#0a1414] border border-white/5 rounded-lg px-3 py-2">
                      <span className="text-xs text-teal-400/70 truncate flex-1 font-mono">
                        /display/{display.slug}
                      </span>
                      <button
                        onClick={() => handleCopyLink(display.slug)}
                        className="text-white/30 hover:text-teal-400 transition-colors flex-shrink-0"
                        title="Copy link"
                      >
                        {copiedSlug === display.slug ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex border-t border-white/5">
                    <a
                      href={`/display/${display.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs text-white/40 hover:text-teal-400 hover:bg-white/5 transition-all border-r border-white/5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>
                    <button
                      onClick={() => handleEdit(display)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs text-white/40 hover:text-amber-400 hover:bg-white/5 transition-all border-r border-white/5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(display)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs text-white/40 hover:text-red-400 hover:bg-white/5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Builder Panel */}
      <DisplayBuilderPanel
        isOpen={panelOpen}
        onClose={() => { setPanelOpen(false); setEditingDisplay(null); }}
        onSaved={fetchDisplays}
        editingDisplay={editingDisplay}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Display"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
