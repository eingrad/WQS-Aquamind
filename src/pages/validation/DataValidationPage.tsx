import { useState, useMemo, useEffect } from "react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import ValidationSidebar from "../../components/validation/ValidationSidebar";
import FlagSidebar from "../../components/validation/FlagSidebar";
import ValidationControls from "../../components/validation/ValidationControls";
import ValidationTable from "../../components/validation/ValidationTable";
import Pagination from "../../components/widgets/Pagination";
import {
  validationStatusLabels,
  validationStatusColors,
  type ValidationDataRow,
  type ValidationStatus,
} from "../../data/validationData";
import {
  getValidationTableData,
  type ValidationRecord,
} from "../../services/validation.service";
import { getDevices } from "../../services/device.service";
import { LandPlot } from "lucide-react";

export default function DataValidationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedDevice, setSelectedDevice] = useState("");

  // Set default date range to today
  const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [validationStatuses, setValidationStatuses] = useState<
    ValidationDataRow[]
  >([]);

  // Track selected cell for flagging
  // All selected cells passed to the FlagSidebar — used to submit a flag
  // request for every cell, not just the first one.
  const [selectedCellsForFlag, setSelectedCellsForFlag] = useState<
    Array<{ timestamp: string; parameter: string }>
  >([]);

  // NEW: Backend data state
  const [backendRecords, setBackendRecords] = useState<ValidationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [devices, setDevices] = useState<any[]>([]);
  const [useBackend] = useState(true); // Toggle for backend vs static data

  // Validation sidebar state
  const [showValidateSidebar, setShowValidateSidebar] = useState(false);
  const [validationType, setValidationType] = useState("Addition");
  const [validateValue, setValidateValue] = useState("");
  const [validationMode, setValidationMode] = useState<
    "Corrected" | "Estimated"
  >("Corrected");

  // Flag sidebar state
  const [showFlagSidebar, setShowFlagSidebar] = useState(false);

  // NEW: Fetch devices on mount and set default
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await getDevices({});
        setDevices(response.devices);
        if (response.devices.length > 0 && !selectedDevice) {
          setSelectedDevice(response.devices[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch devices:", err);
      }
    };
    fetchDevices();
  }, []);

  // NEW: Fetch validation data from backend when using backend mode
  useEffect(() => {
    if (!useBackend || !selectedDevice || !startDate || !endDate) {
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fix single-day filter: set end time to 23:59:59 instead of 00:00:00
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const response = await getValidationTableData({
          deviceId: selectedDevice,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          page: currentPage,
          limit: itemsPerPage,
        });

        setBackendRecords(response.records);
        setTotalRecords(response.pagination.total);
      } catch (err: any) {
        console.error("Failed to fetch validation data:", err);
        setError(err.response?.data?.error || "Failed to load validation data");
        setBackendRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    selectedDevice,
    startDate,
    endDate,
    currentPage,
    itemsPerPage,
    useBackend,
  ]);

  // Filter data by date range (for static data)
  const filteredData = useMemo(() => {
    let filtered = validationStatuses;

    // Filter by date range if both dates are selected
    if (startDate && endDate) {
      filtered = filtered.filter((row) => {
        // Parse row date from format: "21:00, 03/10/25" -> dd/MM/yy
        const datePart = row.time.split(",")[1]?.trim(); // "03/10/25"
        if (!datePart) return false;

        const [day, month, year] = datePart.split("/");
        const fullYear = `20${year}`; // Convert "25" to "2025"
        const rowDate = new Date(`${fullYear}-${month}-${day}`); // YYYY-MM-DD format

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Reset time to midnight for accurate date comparison
        rowDate.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        return rowDate >= start && rowDate <= end;
      });
    }

    return filtered;
  }, [validationStatuses, startDate, endDate]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  // Calculate pagination
  const totalItems = useBackend ? totalRecords : filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // NEW: Use backend data if available, otherwise use static filtered data
  const currentData =
    useBackend && backendRecords.length > 0
      ? backendRecords.map((record) => ({
          id: record.recordId,
          time: new Date(record.timestamp).toLocaleString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }),
          location: record.location,
          ph: record.parameters.ph?.value ?? null,
          phStatus: (record.parameters.ph?.humanValidation?.status ||
            record.parameters.ph?.autoFlag ||
            "no_data") as ValidationStatus,
          phPendingAdminApproval:
            !!record.parameters.ph?.pendingApproval?.isPending,
          do: record.parameters.do?.value ?? null,
          doStatus: (record.parameters.do?.humanValidation?.status ||
            record.parameters.do?.autoFlag ||
            "no_data") as ValidationStatus,
          doPendingAdminApproval:
            !!record.parameters.do?.pendingApproval?.isPending,
          nh3n: record.parameters.nh3n?.value ?? null,
          nh3nStatus: (record.parameters.nh3n?.humanValidation?.status ||
            record.parameters.nh3n?.autoFlag ||
            "no_data") as ValidationStatus,
          nh3nPendingAdminApproval:
            !!record.parameters.nh3n?.pendingApproval?.isPending,
          cod: record.parameters.cod?.value ?? null,
          codStatus: (record.parameters.cod?.humanValidation?.status ||
            record.parameters.cod?.autoFlag ||
            "no_data") as ValidationStatus,
          codPendingAdminApproval:
            !!record.parameters.cod?.pendingApproval?.isPending,
          bod: record.parameters.bod?.value ?? null,
          bodStatus: (record.parameters.bod?.humanValidation?.status ||
            record.parameters.bod?.autoFlag ||
            "no_data") as ValidationStatus,
          bodPendingAdminApproval:
            !!record.parameters.bod?.pendingApproval?.isPending,
          tss: record.parameters.tss?.value ?? null,
          tssStatus: (record.parameters.tss?.humanValidation?.status ||
            record.parameters.tss?.autoFlag ||
            "no_data") as ValidationStatus,
          tssPendingAdminApproval:
            !!record.parameters.tss?.pendingApproval?.isPending,
          temperature: record.parameters.temperature?.value ?? null,
          temperatureStatus: (record.parameters.temperature?.humanValidation
            ?.status ||
            record.parameters.temperature?.autoFlag ||
            "no_data") as ValidationStatus,
          temperaturePendingAdminApproval:
            !!record.parameters.temperature?.pendingApproval?.isPending,
          depth: record.parameters.depth?.value ?? null,
          depthStatus: (record.parameters.depth?.humanValidation?.status ||
            record.parameters.depth?.autoFlag ||
            "no_data") as ValidationStatus,
          depthPendingAdminApproval:
            !!record.parameters.depth?.pendingApproval?.isPending,
        }))
      : filteredData.slice(startIndex, endIndex);

  // Cell selection handler
  const handleCellClick = (rowId: string, parameter: string) => {
    const cellKey = `${rowId}:${parameter}`;
    const newSelected = new Set(selectedCells);

    if (newSelected.has(cellKey)) {
      newSelected.delete(cellKey);
    } else {
      newSelected.add(cellKey);
    }

    setSelectedCells(newSelected);
  };

  // Action handlers
  const handleValidate = () => {
    if (selectedCells.size === 0) return;
    setShowValidateSidebar(true);
  };

  const handleValidateSubmit = () => {
    if (selectedCells.size === 0) return;

    const updatedData = validationStatuses.map((row) => {
      const updates: any = { ...row };

      const parameters = [
        "ph",
        "do",
        "nh3n",
        "cod",
        "bod",
        "tss",
        "temperature",
        "depth",
      ];
      parameters.forEach((param) => {
        const cellKey = `${row.id}:${param}`;
        if (selectedCells.has(cellKey)) {
          // Mark as pending admin approval - keeps original color, shows clock icon
          updates[`${param}ValidatedByHuman`] = true;
          updates[`${param}PendingAdminApproval`] = true;
          updates[`${param}FlaggedByHuman`] = false;
        }
      });

      return updates;
    });

    setValidationStatuses(updatedData);
    setSelectedCells(new Set());
    setShowValidateSidebar(false);
    setValidateValue("");
  };

  const handleFlag = () => {
    if (selectedCells.size === 0) return;

    // Resolve every selected cell key (`<rowId>:<parameter>`) into an
    // {timestamp, parameter} pair. The FlagSidebar then submits one
    // request per resolved cell.
    const cells: Array<{ timestamp: string; parameter: string }> = [];

    for (const cellKey of selectedCells) {
      // Use the LAST colon since timestamps contain colons.
      const lastColonIndex = cellKey.lastIndexOf(":");
      const rowId = cellKey.substring(0, lastColonIndex);
      const parameter = cellKey.substring(lastColonIndex + 1);

      if (useBackend) {
        const row = backendRecords.find(
          (r) => `hourly-${r.timestamp}` === rowId,
        );
        if (row) cells.push({ timestamp: row.timestamp, parameter });
      } else {
        const row = validationStatuses.find((r) => r.id === rowId);
        if (row && row.time) {
          // Parse "HH:MM, DD/MM/YY" → ISO
          const [timePart, datePart] = row.time.split(", ");
          const [day, month, year] = datePart.split("/");
          const [hour, minute] = timePart.split(":");
          const isoDate = `20${year}-${month}-${day}T${hour}:${minute}:00.000Z`;
          cells.push({ timestamp: isoDate, parameter });
        }
      }
    }

    if (cells.length === 0) {
      console.error("No selected cells could be resolved to rows");
      return;
    }

    setSelectedCellsForFlag(cells);
    setShowFlagSidebar(true);
  };

  // Handle flag submission from sidebar

  return (
    <div className="relative flex flex-col lg:flex-row bg-[#ffffff] min-h-screen text-slate-800 w-full overflow-x-hidden min-w-0">
      <Sidebar
        active="Data Validation"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar
          title="Data Validation"
          view={"table"}
          setView={function (): void {
            throw new Error("Function not implemented.");
          }}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Header Controls */}
        <ValidationControls
          selectedDevice={selectedDevice}
          startDate={startDate}
          endDate={endDate}
          selectedCellsCount={selectedCells.size}
          devices={devices}
          onDeviceChange={setSelectedDevice}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onFlag={handleFlag}
          onValidate={handleValidate}
        />

        {/* Validation Legend - only show when there's data */}
        {!isLoading && !error && currentData.length > 0 && (
          <div className="mt-6 mb-6 ml-4 flex flex-wrap items-center gap-4 text-xs">
            {(
              Object.entries(validationStatusLabels) as [
                ValidationStatus,
                string,
              ][]
            ).map(([status, label]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${validationStatusColors[status]}`}
                />
                <span className="text-slate-700">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        <>
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <span className="ml-3 text-slate-500">
                Loading validation data...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="mx-4 mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Table */}
          {!isLoading && !error && currentData.length === 0 ? (
            <div className="mx-4 mt-6 bg-[#ffffff] border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-5 animate-pulse">
                <LandPlot className="w-8 h-8 text-blue-500/50" />
              </div>
              <h3 className="text-slate-800 font-medium text-lg mb-2">
                No Validation Data
              </h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-2">
                No telemetry data found for the selected device and date range.
                Try adjusting the filters above.
              </p>
            </div>
          ) : !isLoading && !error ? (
            <ValidationTable
              data={currentData}
              selectedCells={selectedCells}
              onCellClick={handleCellClick}
            />
          ) : null}

          {/* Pagination - only show when there's data */}
          {!isLoading && currentData.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
        </>
      </div>

      {/* Validation Sidebar */}
      <ValidationSidebar
        isOpen={showValidateSidebar}
        validationType={validationType}
        validateValue={validateValue}
        validationMode={validationMode}
        onClose={() => setShowValidateSidebar(false)}
        onValidationTypeChange={setValidationType}
        onValidateValueChange={setValidateValue}
        onValidationModeChange={setValidationMode}
        onSubmit={handleValidateSubmit}
      />

      {/* Flag Sidebar */}
      {showFlagSidebar && selectedCellsForFlag.length > 0 && (
        <FlagSidebar
          onClose={() => {
            setShowFlagSidebar(false);
            setSelectedCellsForFlag([]);
          }}
          onSuccess={() => {
            // Refresh data after successful flag submission
            if (useBackend && selectedDevice && startDate && endDate) {
              window.location.reload();
            }
            setSelectedCells(new Set());
            setSelectedCellsForFlag([]);
          }}
          deviceId={selectedDevice}
          cells={selectedCellsForFlag}
        />
      )}
    </div>
  );
}
