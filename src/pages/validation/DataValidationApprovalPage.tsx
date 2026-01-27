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

const parameterDisplayNames: Record<string, string> = {
  so2: "SO₂",
  h2s: "H₂S",
  no2: "NO₂",
  btex: "BTEX",
  windSpeed: "Wind Speed",
  windDirection: "Wind Direction",
  temperature: "Temperature",
  humidity: "Humidity",
  pressure: "Pressure",
  solar: "Solar Radiation",
  rain: "Rain",
};

export default function DataValidationApprovalPage() {
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
    <div className="relative flex flex-col lg:flex-row bg-[#0f1a1a] min-h-screen text-white w-full overflow-x-hidden">
      <div className="z-50 lg:z-auto">
        <Sidebar active="Data Approval" />
      </div>

      <div className="flex flex-col flex-1">
        <Topbar
          title="Data Approval"
          view={"table"}
          setView={function (): void {
            throw new Error("Function not implemented.");
          }}
        />

        {/* Header Controls */}
        <div className="bg-[#0f1717] px-4 sm:px-6 py-4 border-white/5 border-b">
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
        <div className="bg-[#0f1717] px-4 sm:px-6 py-3 border-b border-white/5">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === "all"
                  ? "bg-teal-500 text-black"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
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
                  ? "bg-teal-500 text-black"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
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
                  ? "bg-teal-500 text-black"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
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
                  ? "bg-teal-500 text-black"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Rejected ({data.filter((row) => row.status === "rejected").length}
              )
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Table */}
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
            endIndex={Math.min(currentPage * itemsPerPage, filteredData.length)}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
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
