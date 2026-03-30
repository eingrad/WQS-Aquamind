import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import DateRangePicker from "./DateRangePicker";
import api from "../../services/api";

interface Device {
  id: string;
  deviceCode: string;
  name: string;
  location: string;
}

export default function ReportPanel({ onClose }: { onClose: () => void }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [frequency, setFrequency] = useState<string>("");
  const [exportType, setExportType] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Fetch devices on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await api.get("/devices");
        console.log("Device API Response:", response.data);

        // API returns: { success: true, data: { devices: [...], pagination: {...} } }
        const deviceList = response.data.data?.devices || [];
        console.log("Devices loaded:", deviceList);
        setDevices(deviceList);
      } catch (error) {
        console.error("Failed to fetch devices:", error);
        setError("Failed to load devices");
      }
    };

    fetchDevices();
  }, []);

  const downloadFile = async (
    url: string,
    body: any,
    filename: string,
    contentType: string,
  ) => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Download failed");
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(
      new Blob([blob], { type: contentType }),
    );
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const generateReport = async () => {
    // Validate inputs
    if (!selectedDevice) {
      setError("Please select a device");
      return;
    }
    if (!frequency) {
      setError("Please select a report frequency");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select a date range");
      return;
    }
    if (!exportType) {
      setError("Please select one export format");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const requestBody = {
        deviceId: selectedDevice,
        startDate,
        endDate,
        frequency: frequency.toLowerCase(),
      };

      if (exportType === "PDF") {
        await downloadFile(
          `${API_URL}/reports/export/pdf`,
          requestBody,
          `report_${selectedDevice}_${frequency}_${startDate}_to_${endDate}.pdf`,
          "application/pdf",
        );
      } else if (exportType === "CSV") {
        await downloadFile(
          `${API_URL}/reports/export/csv`,
          requestBody,
          `report_${selectedDevice}_${frequency}_${startDate}_to_${endDate}.csv`,
          "text/csv",
        );
      } else if (exportType === "TXT") {
        await downloadFile(
          `${API_URL}/reports/export/txt`,
          requestBody,
          `report_${selectedDevice}_${frequency}_${startDate}_to_${endDate}.txt`,
          "text/plain",
        );
      }

      // Success - close panel
      onClose();
    } catch (err: any) {
      console.error("Report generation error:", err);
      setError(err.message || "Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-[#0f1a1a] border-l border-white/10 z-[1000] p-6 overflow-y-auto flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-white">Reports</h2>
        <button onClick={onClose}>
          <X className="text-white w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6 text-sm flex-grow">
        {/* Device Dropdown */}
        <div>
          <label className="block text-sm mb-3 text-white">
            Devices Name<span className="text-red-500"> *</span>
          </label>
          <div className="relative">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-4 py-3 pr-10 rounded-lg bg-[#0f1a1a] text-sm border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none"
            >
              <option value="">-- Select Device --</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-teal-400 pointer-events-none" />
          </div>
        </div>

        {/* Frequency Checkboxes */}
        <div className="pt-4 border-t border-white/10 mt-auto">
          <div>
            <label className="block mb-4 text-white">
              Report Frequency<span className="text-red-500"> *</span>
            </label>
            <div className="flex gap-18">
              {["Daily", "Weekly", "Monthly"].map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={frequency === item}
                    onChange={() =>
                      setFrequency(frequency === item ? "" : item)
                    }
                    className="w-4 h-4 accent-teal-500"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="pt-4 border-t border-white/10 mt-auto">
          <div>
            <label className="block mb-4 text-white">Date Range</label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              fullWidth
            />
          </div>
        </div>

        {/* Export Type Checkboxes */}
        <div className="pt-4 border-t border-white/10 mt-auto">
          <label className="block mb-4 text-gray-300">Export Format</label>
          <div className="flex gap-25">
            {["CSV", "PDF", "TXT"].map((item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportType === item}
                  onChange={() =>
                    setExportType(exportType === item ? "" : item)
                  }
                  className="w-4 h-4 accent-teal-500"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="pt-4 border-t border-white/10 flex justify-between mt-auto">
        <button
          onClick={generateReport}
          disabled={isGenerating}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? "Generating..." : "Generate Report"}
        </button>
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="border border-white/20 px-4 py-2 rounded-md text-sm text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
