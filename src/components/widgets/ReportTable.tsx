import { Download, Trash2, Eye, FileBarChart } from "lucide-react";
import { useState, useEffect } from "react";
import ConfirmDialog from "../modals/ConfirmDialog";

interface Report {
  id: string;
  reportType: string;
  title: string;
  description: string;
  timeFrom: string;
  timeTo: string;
  deviceIds: string[];
  parameters: string[];
  fileFormat: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  status: string;
  createdAt: string;
  creator: {
    fullName: string;
    email: string;
  };
}

export default function ReportTable() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    reportId: string;
    reportTitle: string;
  }>({ isOpen: false, reportId: "", reportTitle: "" });
  const [errorDialog, setErrorDialog] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_URL}/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    setDownloading(reportId);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_URL}/reports/${reportId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const report = reports.find((r) => r.id === reportId);

      if (!report) return;

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", report.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      setErrorDialog({
        isOpen: true,
        message: "Failed to download report. Please try again.",
      });
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = async (reportId: string) => {
    setPreviewing(reportId);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_URL}/reports/${reportId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Preview failed");
      }

      const blob = await response.blob();
      const previewUrl = window.URL.createObjectURL(blob);
      window.open(previewUrl, "_blank");
    } catch (error) {
      console.error("Preview error:", error);
      setErrorDialog({
        isOpen: true,
        message: "Failed to preview report. Please try again.",
      });
    } finally {
      setPreviewing(null);
    }
  };

  const handleDelete = async (reportId: string, reportTitle: string) => {
    // Show confirmation dialog
    setDeleteDialog({ isOpen: true, reportId, reportTitle });
  };

  const confirmDelete = async () => {
    const { reportId } = deleteDialog;

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_URL}/reports/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      // Remove from local state
      setReports(reports.filter((r) => r.id !== reportId));
      setDeleteDialog({ isOpen: false, reportId: "", reportTitle: "" });
    } catch (error) {
      console.error("Delete error:", error);
      setErrorDialog({
        isOpen: true,
        message: "Failed to delete report. Please try again.",
      });
      setDeleteDialog({ isOpen: false, reportId: "", reportTitle: "" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateRange = (from: string, to: string) => {
    const fromDate = formatDate(from);
    const toDate = formatDate(to);
    return fromDate === toDate ? fromDate : `${fromDate} - ${toDate}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      {/* Reports Table */}
      <div className="w-full overflow-x-auto border border-white/5 bg-[#0f1a1a]">
        <p className="p-4 text-white font-semibold text-lg">Existing Reports</p>

        {loading ? (
          <div className="p-8 text-center text-white/50">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-t border-white/5">
            <div className="p-4 rounded-full bg-white/5 mb-4 animate-pulse">
              <FileBarChart className="w-8 h-8 text-teal-500/50" />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">
              No Reports Generated
            </h3>
            <p className="text-white/50 text-sm max-w-sm mx-auto">
              Select your desired parameters in the panel above and click
              "Generate Report" to create your first detailed analysis.
            </p>
          </div>
        ) : (
          <table className="min-w-full text-sm text-left text-white mt-4">
            <thead className="border-b border-white/5">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">File Type</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Generated</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">{report.title}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize">{report.reportType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${
                        report.fileFormat === "PDF"
                          ? "bg-red-900/30 text-red-300 border-red-700/50"
                          : "bg-green-900/30 text-green-300 border-green-700/50"
                      }`}
                    >
                      {report.fileFormat || "PDF"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {formatDateRange(report.timeFrom, report.timeTo)}
                  </td>
                  <td className="px-4 py-3">{formatDate(report.createdAt)}</td>
                  <td className="px-4 py-3">
                    {formatFileSize(report.fileSize)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreview(report.id)}
                        disabled={previewing === report.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-md flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Preview"
                      >
                        <Eye size={16} />
                        {previewing === report.id && (
                          <span className="ml-1">...</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleDownload(report.id)}
                        disabled={downloading === report.id}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded text-md flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={16} />
                        {downloading === report.id && (
                          <span className="ml-1">...</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(report.id, report.title)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-md flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Report"
        message={`Are you sure you want to delete "${deleteDialog.reportTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteDialog({ isOpen: false, reportId: "", reportTitle: "" })
        }
      />

      {/* Error Dialog */}
      <ConfirmDialog
        isOpen={errorDialog.isOpen}
        title="Error"
        message={errorDialog.message}
        confirmText="OK"
        type="warning"
        onConfirm={() => setErrorDialog({ isOpen: false, message: "" })}
      />
    </>
  );
}
