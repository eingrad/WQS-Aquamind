import { useState } from "react";
import Sidebar from "../../components/widgets/Sidebar.tsx";
import Topbar from "../../components/widgets/Topbar.tsx";
import ReportPanel from "../../components/widgets/ReportPanel.tsx";
import ReportTable from "../../components/widgets/ReportTable.tsx";

export default function ReportsPage() {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="relative flex flex-col lg:flex-row bg-[#0f1a1a] min-h-screen text-white w-screen max-w-screen overflow-x-hidden">
      <Sidebar active="Report" />
      <div className="flex flex-col flex-1 relative">
        <Topbar
          title="Reports"
          view={"table"}
          setView={function (_v: "graph" | "table"): void {
            throw new Error("Function not implemented.");
          }}
        />
        <div className="p-4 border-white/5 border-b">
          <button
            onClick={() => setShowPanel(true)}
            className="px-4 py-2 bg-teal-600 text-black font-medium hover:bg-teal-700 rounded-md text-sm"
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
              <ReportPanel onClose={() => setShowPanel(false)} />
            </div>
          </>
        )}

        <ReportTable />
      </div>
    </div>
  );
}
