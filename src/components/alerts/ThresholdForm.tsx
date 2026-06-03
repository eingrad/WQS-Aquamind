import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import * as thresholdService from "../../services/alert-threshold.service";

interface ThresholdFormProps {
  threshold?: any; // Existing threshold for editing (null for new)
  onClose: () => void;
  onSuccess: () => void;
}

const parameters = [
  { value: "ph",          label: "pH" },
  { value: "do",          label: "Dissolved Oxygen (DO)" },
  { value: "nh3n",        label: "NH₃-N" },
  { value: "cod",         label: "COD" },
  { value: "bod",         label: "BOD" },
  { value: "tss",         label: "TSS" },
  { value: "temperature", label: "Temperature" },
  { value: "depth",       label: "Depth" },
];

const operators = [
  { value: ">", label: "> Greater than" },
  { value: ">=", label: ">= Greater or equal" },
  { value: "<", label: "< Less than" },
  { value: "<=", label: "<= Less or equal" },
  { value: "==", label: "== Equal to" },
];

const severities = [
  { value: "warning", label: "Warning", color: "text-yellow-600" },
  { value: "critical", label: "Critical", color: "text-orange-600" },
  { value: "emergency", label: "Emergency", color: "text-red-600" },
];

export default function ThresholdForm({
  threshold,
  onClose,
  onSuccess,
}: ThresholdFormProps) {
  const [formData, setFormData] = useState({
    parameter: threshold?.parameter || "ph",
    thresholdType: threshold?.thresholdType || "warning",
    operator: threshold?.operator || ">",
    value: threshold?.value?.toString() || "",
    cooldownMinutes: threshold?.cooldownMinutes?.toString() || "60",
    deviceId: threshold?.deviceId || "", // Empty = global (all devices)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.value || parseFloat(formData.value) < 0) {
      setError("Please enter a valid threshold value");
      return;
    }

    if (!formData.cooldownMinutes || parseInt(formData.cooldownMinutes) < 5) {
      setError("Cooldown must be at least 5 minutes");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: any = {
        parameter: formData.parameter,
        thresholdType: formData.thresholdType,
        operator: formData.operator,
        value: parseFloat(formData.value),
        cooldownMinutes: parseInt(formData.cooldownMinutes),
      };

      // Only include deviceId if it's not empty
      if (formData.deviceId) {
        payload.deviceId = formData.deviceId;
      }

      if (threshold) {
        // Update existing
        await thresholdService.updateThreshold(threshold.id, payload);
      } else {
        // Create new
        await thresholdService.createThreshold(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to save threshold",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[1060] transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full sm:w-[400px] md:w-[440px] lg:w-[480px] xl:w-[500px] bg-[#ffffff] border-l border-slate-200 z-[1070] shadow-2xl
          transform transition-transform duration-300 ease-out flex flex-col"
      >
        {/* Header - Fixed */}
        <div className="bg-[#ffffff] border-b border-slate-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {threshold ? "Edit Threshold" : "Create New Threshold"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Parameter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Parameter <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.parameter}
                  onChange={(e) =>
                    setFormData({ ...formData, parameter: e.target.value })
                  }
                  className="w-full px-4 py-3 pr-10 rounded-lg bg-[#ffffff] text-sm border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
                  required
                >
                  {parameters.map((param) => (
                    <option key={param.value} value={param.value}>
                      {param.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Severity Level <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {severities.map((severity) => (
                  <button
                    key={severity.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        thresholdType: severity.value,
                      })
                    }
                    className={`
                    px-3 py-2.5 rounded-lg border transition font-medium text-xs
                    ${
                      formData.thresholdType === severity.value
                        ? `${severity.color} border-current bg-current/10`
                        : "border-slate-200 text-slate-500 hover:border-slate-200"
                    }
                  `}
                  >
                    {severity.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition (Operator + Value) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Threshold Condition <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={formData.operator}
                  onChange={(e) =>
                    setFormData({ ...formData, operator: e.target.value })
                  }
                  className="col-span-2 px-4 py-3 pr-10 rounded-lg bg-[#ffffff] text-sm border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
                  required
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="Enter value"
                  className="col-span-2 px-4 py-3 rounded-lg bg-[#ffffff] text-sm border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Alert triggers when value {formData.operator}{" "}
                {formData.value || "___"}
              </p>
            </div>

            {/* Cooldown */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Cooldown Period (minutes){" "}
                <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="5"
                value={formData.cooldownMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, cooldownMinutes: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-[#ffffff] text-sm border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Minimum 5 minutes, maximum 24 hours (1440 minutes)
              </p>
            </div>

            {/* Scope Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-600">
                <strong>Scope:</strong> This threshold applies to{" "}
                <strong>all devices</strong> (global threshold)
              </p>
            </div>
          </div>
        </div>

        {/* Footer Buttons - Fixed at Bottom */}
        <div className="bg-[#ffffff] border-t border-slate-200 p-5 flex-shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-100 rounded-lg text-md transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium text-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : threshold ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
