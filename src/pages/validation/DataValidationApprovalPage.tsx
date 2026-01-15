import { useState, useMemo } from "react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import ApprovalTable from "../../components/approval/ApprovalTable";
import ApprovalActionSidebar from "../../components/approval/ApprovalActionSidebar";
import Pagination from "../../components/widgets/Pagination";
import DateRangePicker from "../../components/widgets/DateRangePicker";

import { approvalData, type ApprovalDataRow } from "../../data/approvalData";

export default function DataValidationApprovalPage() {
  const [data, setData] = useState(approvalData);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [selectedRow, setSelectedRow] = useState<ApprovalDataRow | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

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

  const handleApprove = (id: string, adminRemarks: string) => {
    setData((prevData) =>
      prevData.map((row) =>
        row.id === id
          ? { ...row, status: "approved" as const, adminRemarks }
          : row
      )
    );
    console.log(`Approved: ${id}, Remarks: ${adminRemarks}`);
  };

  const handleReject = (id: string, adminRemarks: string) => {
    setData((prevData) =>
      prevData.map((row) =>
        row.id === id
          ? { ...row, status: "rejected" as const, adminRemarks }
          : row
      )
    );
    console.log(`Rejected: ${id}, Remarks: ${adminRemarks}`);
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
