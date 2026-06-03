import { useState, useMemo, useEffect } from "react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import ApprovalTable from "../../components/approval/ApprovalTable";
import ApprovalActionSidebar from "../../components/approval/ApprovalActionSidebar";
import Pagination from "../../components/widgets/Pagination";
import DateRangePicker from "../../components/widgets/DateRangePicker";
import { type ApprovalDataRow } from "../../data/approvalData";
import {
  fetchAllApprovals,
  approveFlag,
  rejectFlag,
  type PendingApprovalRequest,
} from "../../services/approval.service";
import { CircleCheckBig } from "lucide-react";

const parameterDisplayNames: Record<string, string> = {
  ph: "pH",
  do: "DO",
  nh3n: "NH₃-N",
  cod: "COD",
  bod: "BOD",
  tss: "TSS",
  temperature: "Temperature",
  depth: "Depth",
};

export default function DataValidationApprovalPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<ApprovalDataRow[]>([]);
  const [, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [selectedRow, setSelectedRow] = useState<ApprovalDataRow | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  // Fetch pending approvals from backend
  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const approvals = await fetchAllApprovals();

      // Transform backend data to UI format
      const transformedData: ApprovalDataRow[] = approvals.map(
        (approval: PendingApprovalRequest) => {
          console.log("Approval data:", approval); // Debug log

          // Parse date from requestedAt
          const date = approval.requestedAt
            ? new Date(approval.requestedAt)
            : new Date();

          const timeStr = date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const dateStr = date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });

          const parameterName =
            parameterDisplayNames[approval.parameter] || approval.parameter;

          console.log("Transformed:", {
            time: `${timeStr}, ${dateStr}`,
            parameter: parameterName,
            requestedBy: approval.requestedBy?.name,
            status: approval.status,
          });

          // Map status from backend to frontend
          const status = (approval.status || "pending") as
            | "pending"
            | "approved"
            | "rejected";

          return {
            id: approval.approvalId,
            time: `${timeStr}, ${dateStr}`,
            parameter: parameterName,
            parameterKey: approval.parameter,
            value: approval.hourlyValue ?? 0,
            remarks: approval.qcRemarks || "",
            status: status,
            requestedBy: approval.requestedBy?.name || "Unknown User",
            flagType: approval.flagType as any,
            approvalType: "flag" as const,
            adminRemarks: approval.adminRemarks,
            dataCapturedAt: approval.timeRange?.from
              ? (() => {
                  const d = new Date(approval.timeRange.from);
                  const t = d.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const dt = d.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  });
                  return `${t}, ${dt}`;
                })()
              : undefined,
          };
        },
      );

      setData(transformedData);
    } catch (err: any) {
      console.error("Failed to fetch all approvals:", err);
      setError(err.message || "Failed to load approval requests");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Filter by date range if both dates are selected
    if (startDate && endDate) {
      filtered = filtered.filter((row) => {
        // Parse the date from the row's time field (format: "HH:MM, DD/MM/YY")
        const datePart = row.time.split(", ")[1]; // Get "DD/MM/YY" part
        const [day, month, year] = datePart.split("/");
        const fullYear = `20${year}`; // Convert "25" to "2025"
        const rowDate = new Date(`${fullYear}-${month}-${day}`);

        const start = new Date(startDate);
        const end = new Date(endDate);

        return rowDate >= start && rowDate <= end;
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }

    return filtered;
  }, [data, startDate, endDate, statusFilter]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleActionClick = (row: ApprovalDataRow) => {
    setSelectedRow(row);
    setIsSidebarOpen(true);
  };

  const handleApprove = async (id: string, adminRemarks: string) => {
    try {
      await approveFlag(id, adminRemarks);
      console.log(`Approved: ${id}, Remarks: ${adminRemarks}`);

      // Refresh data to show updated status
      await loadPendingApprovals();

      // Close sidebar
      setIsSidebarOpen(false);
    } catch (err: any) {
      console.error("Failed to approve:", err);
      alert(err.message || "Failed to approve request");
    }
  };

  const handleReject = async (id: string, adminRemarks: string) => {
    try {
      await rejectFlag(id, adminRemarks);
      console.log(`Rejected: ${id}, Remarks: ${adminRemarks}`);

      // Refresh data to show updated status
      await loadPendingApprovals();

      // Close sidebar
      setIsSidebarOpen(false);
    } catch (err: any) {
      console.error("Failed to reject:", err);
      alert(err.message || "Failed to reject request");
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row bg-[#ffffff] min-h-screen text-slate-800 w-full overflow-x-hidden">
      <Sidebar
        active="Data Approval"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <div className="flex flex-col flex-1">
        <Topbar
          title="Data Approval"
          view={"table"}
          setView={function (): void {
            throw new Error("Function not implemented.");
          }}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Header Controls */}
        <div className="bg-[#ffffff] px-4 sm:px-6 py-4 border-slate-200 border-b">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filters */}
            <div className="flex items-center gap-3">
              {/* Date Range Picker */}
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-[#ffffff] px-4 sm:px-6 py-3 border-b border-slate-200">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === "all"
                  ? "bg-blue-500 text-black"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              All ({data.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter("pending");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === "pending"
                  ? "bg-blue-500 text-black"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              Pending ({data.filter((row) => row.status === "pending").length})
            </button>
            <button
              onClick={() => {
                setStatusFilter("approved");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === "approved"
                  ? "bg-blue-500 text-black"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              Accepted ({data.filter((row) => row.status === "approved").length}
              )
            </button>
            <button
              onClick={() => {
                setStatusFilter("rejected");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === "rejected"
                  ? "bg-blue-500 text-black"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              Rejected ({data.filter((row) => row.status === "rejected").length}
              )
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Table or Empty State */}
          {paginatedData.length === 0 ? (
            <div className="mx-4 mt-6 bg-[#ffffff] border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-5 animate-pulse">
                <CircleCheckBig className="w-8 h-8 text-blue-500/50" />
              </div>
              <h3 className="text-slate-800 font-medium text-lg mb-2">
                No Approval Requests
              </h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-2">
                There are no flag requests to review at the moment. Requests
                will appear here when QC reviewers flag data for approval.
              </p>
            </div>
          ) : (
            <>
              <ApprovalTable
                data={paginatedData}
                onActionClick={handleActionClick}
              />

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                startIndex={(currentPage - 1) * itemsPerPage}
                endIndex={Math.min(
                  currentPage * itemsPerPage,
                  filteredData.length,
                )}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(newItemsPerPage) => {
                  setItemsPerPage(newItemsPerPage);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Approval Action Sidebar */}
      <ApprovalActionSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedRow={selectedRow}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
