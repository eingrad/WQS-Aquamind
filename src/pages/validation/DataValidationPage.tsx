import { useState, useMemo, useEffect } from "react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import ValidationSidebar from "../../components/validation/ValidationSidebar";
import FlagSidebar from "../../components/validation/FlagSidebar";
import ValidationControls from "../../components/validation/ValidationControls";
import ValidationTable from "../../components/validation/ValidationTable";
import Pagination from "../../components/widgets/Pagination";
import {
  validationData,
  validationStatusLabels,
  validationStatusColors,
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
  const [validationStatuses, setValidationStatuses] = useState(validationData);

  // Track selected cell for flagging
  const [selectedCellForFlag, setSelectedCellForFlag] = useState<{
    timestamp: string;
    parameter: string;
  } | null>(null);

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
          so2: record.parameters.so2?.value || null,
          so2Status: (record.parameters.so2?.humanValidation?.status ||
            record.parameters.so2?.autoFlag ||
            "no_data") as ValidationStatus,
          so2PendingAdminApproval:
            !!record.parameters.so2?.pendingApproval?.isPending,
          h2s: record.parameters.h2s?.value || null,
          h2sStatus: (record.parameters.h2s?.humanValidation?.status ||
            record.parameters.h2s?.autoFlag ||
            "no_data") as ValidationStatus,
          h2sPendingAdminApproval:
            !!record.parameters.h2s?.pendingApproval?.isPending,
          no2: record.parameters.no2?.value || null,
          no2Status: (record.parameters.no2?.humanValidation?.status ||
            record.parameters.no2?.autoFlag ||
            "no_data") as ValidationStatus,
          no2PendingAdminApproval:
            !!record.parameters.no2?.pendingApproval?.isPending,
          benzene: record.parameters.benzene?.value ?? null,
          benzeneStatus: (record.parameters.benzene?.humanValidation?.status ||
            record.parameters.benzene?.autoFlag ||
            "no_data") as ValidationStatus,
          benzenePendingAdminApproval:
            !!record.parameters.benzene?.pendingApproval?.isPending,
          toluene: record.parameters.toluene?.value ?? null,
          tolueneStatus: (record.parameters.toluene?.humanValidation?.status ||
            record.parameters.toluene?.autoFlag ||
            "no_data") as ValidationStatus,
          toluenePendingAdminApproval:
            !!record.parameters.toluene?.pendingApproval?.isPending,
          ethylbenzene: record.parameters.ethylbenzene?.value ?? null,
          ethylbenzeneStatus: (record.parameters.ethylbenzene?.humanValidation
            ?.status ||
            record.parameters.ethylbenzene?.autoFlag ||
            "no_data") as ValidationStatus,
          ethylbenzenePendingAdminApproval:
            !!record.parameters.ethylbenzene?.pendingApproval?.isPending,
          xylenes: record.parameters.xylenes?.value ?? null,
          xylenesStatus: (record.parameters.xylenes?.humanValidation
            ?.status ||
            record.parameters.xylenes?.autoFlag ||
            "no_data") as ValidationStatus,
          xylenesPendingAdminApproval:
            !!record.parameters.xylenes?.pendingApproval?.isPending,
          windSpeed: record.parameters.windSpeed?.value ?? null,
          windSpeedStatus: (record.parameters.windSpeed?.humanValidation
            ?.status ||
            record.parameters.windSpeed?.autoFlag ||
            "no_data") as ValidationStatus,
          windSpeedPendingAdminApproval:
            !!record.parameters.windSpeed?.pendingApproval?.isPending,
          windDirection: record.parameters.windDirection?.value ?? null,
          windDirectionStatus: (record.parameters.windDirection?.humanValidation
            ?.status ||
            record.parameters.windDirection?.autoFlag ||
            "no_data") as ValidationStatus,
          windDirectionPendingAdminApproval:
            !!record.parameters.windDirection?.pendingApproval?.isPending,
          temperature: record.parameters.temperature?.value ?? null,
          temperatureStatus: (record.parameters.temperature?.humanValidation
            ?.status ||
            record.parameters.temperature?.autoFlag ||
            "no_data") as ValidationStatus,
          temperaturePendingAdminApproval:
            !!record.parameters.temperature?.pendingApproval?.isPending,
          humidity: record.parameters.humidity?.value ?? null,
          humidityStatus: (record.parameters.humidity?.humanValidation
            ?.status ||
            record.parameters.humidity?.autoFlag ||
            "no_data") as ValidationStatus,
          humidityPendingAdminApproval:
            !!record.parameters.humidity?.pendingApproval?.isPending,
          pressure: record.parameters.pressure?.value ?? null,
          pressureStatus: (record.parameters.pressure?.humanValidation
            ?.status ||
            record.parameters.pressure?.autoFlag ||
            "no_data") as ValidationStatus,
          pressurePendingAdminApproval:
            !!record.parameters.pressure?.pendingApproval?.isPending,
          rain: record.parameters.rain?.value ?? null,
          rainStatus: (record.parameters.rain?.humanValidation?.status ||
            record.parameters.rain?.autoFlag ||
            "no_data") as ValidationStatus,
          rainPendingAdminApproval:
            !!record.parameters.rain?.pendingApproval?.isPending,
          radiation: record.parameters.solar?.value ?? null,
          radiationStatus: (record.parameters.solar?.humanValidation?.status ||
            record.parameters.solar?.autoFlag ||
            "no_data") as ValidationStatus,
          radiationPendingAdminApproval:
            !!record.parameters.solar?.pendingApproval?.isPending,
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
        "so2",
        "h2s",
        "no2",
        "windSpeed",
        "windDirection",
        "temperature",
        "humidity",
        "radiation",
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
    if (selectedCells.size === 0) {
      console.log("No cells selected");
      return;
    }

    console.log("Selected cells:", Array.from(selectedCells));
    console.log("useBackend:", useBackend);

    // Get the first selected cell to determine timestamp and parameter
    const firstCell = Array.from(selectedCells)[0];

    // Split by LAST colon since timestamp contains colons
    const lastColonIndex = firstCell.lastIndexOf(":");
    const rowId = firstCell.substring(0, lastColonIndex);
    const parameter = firstCell.substring(lastColonIndex + 1);

    console.log("First cell:", firstCell);
    console.log("Row ID:", rowId);
    console.log("Parameter:", parameter);

    // Find the row to get timestamp
    if (useBackend) {
      console.log("Backend records:", backendRecords.length);
      const row = backendRecords.find((r) => {
        const id = `hourly-${r.timestamp}`;
        console.log("Comparing:", id, "with", rowId);
        return id === rowId;
      });

      console.log("Found row:", row);

      if (row) {
        setSelectedCellForFlag({
          timestamp: row.timestamp,
          parameter: parameter,
        });
        setShowFlagSidebar(true);
        console.log("Sidebar should show now");
      } else {
        console.error("Row not found!");
      }
    } else {
      const row = validationStatuses.find((r) => r.id === rowId);
      if (row && row.time) {
        // Parse time format "HH:MM, DD/MM/YY" to ISO timestamp
        const [timePart, datePart] = row.time.split(", ");
        const [day, month, year] = datePart.split("/");
        const [hour, minute] = timePart.split(":");
        const isoDate = `20${year}-${month}-${day}T${hour}:${minute}:00.000Z`;

        setSelectedCellForFlag({
          timestamp: isoDate,
          parameter: parameter,
        });
        setShowFlagSidebar(true);
      }
    }
  };

  // Handle flag submission from sidebar

  return (
    <div className="relative flex flex-col lg:flex-row bg-[#0f1a1a] min-h-screen text-white w-full overflow-x-hidden min-w-0">
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
                <span className="text-gray-300">{label}</span>
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
              <span className="ml-3 text-gray-400">
                Loading validation data...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="mx-4 mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Table */}
          {!isLoading && !error && currentData.length === 0 ? (
            <div className="mx-4 mt-6 bg-[#121b1b] border border-white/5 rounded-xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-5 animate-pulse">
                <LandPlot className="w-8 h-8 text-teal-500/50" />
              </div>
              <h3 className="text-white font-medium text-lg mb-2">
                No Validation Data
              </h3>
              <p className="text-white/50 text-sm max-w-sm mx-auto mb-2">
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
      {showFlagSidebar && selectedCellForFlag && (
        <FlagSidebar
          onClose={() => {
            setShowFlagSidebar(false);
            setSelectedCellForFlag(null);
          }}
          onSuccess={() => {
            // Refresh data after successful flag submission
            if (useBackend && selectedDevice && startDate && endDate) {
              // Trigger data refetch
              window.location.reload(); // Simple refresh for now
            }
            setSelectedCells(new Set());
            setSelectedCellForFlag(null);
          }}
          deviceId={selectedDevice}
          hourTimestamp={selectedCellForFlag.timestamp}
          parameter={selectedCellForFlag.parameter}
        />
      )}
    </div>
  );
}
