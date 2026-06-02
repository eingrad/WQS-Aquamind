import { useState } from "react";
import Sidebar from "../../components/widgets/Sidebar.tsx";
import Topbar from "../../components/widgets/Topbar.tsx";
import ReportPanel from "../../components/widgets/ReportPanel.tsx";
import ReportTable from "../../components/widgets/ReportTable.tsx";

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  // Bumping this key signals ReportTable to refetch so a newly generated
  // report shows up immediately without requiring a manual page reload.
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="relative flex flex-col lg:flex-row bg-[#ffffff] min-h-screen text-slate-800 w-screen max-w-screen overflow-x-hidden">
      <Sidebar active="Report" isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="flex flex-col flex-1 relative">
        <Topbar
          title="Reports"
          view={"table"}
          setView={function (_v: "graph" | "table"): void {
            throw new Error("Function not implemented.");
          }}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <div className="p-4 border-slate-200 border-b">
          <button
            onClick={() => setShowPanel(true)}
            className="px-4 py-2 bg-blue-600 text-black font-medium hover:bg-blue-700 rounded-md text-sm"
          >
            Add Reports
          </button>
        </div>

        {/* Overlay + Panel */}
        {showPanel && (
          <>
            {/* Darkened background */}
            <div
              className="fixed inset-0 bg-black/40 z-[998]"
              onClick={() => setShowPanel(false)}
            />
            {/* Slide-in panel */}
            <div className="z-[999] relative">
              <ReportPanel
                onClose={() => setShowPanel(false)}
                onReportGenerated={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </>
        )}

        <ReportTable refreshKey={refreshKey} />
      </div>
    </div>
  );
}
