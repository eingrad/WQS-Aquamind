import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import Card from "../../components/widgets/Card";
import { notificationPreferencesService } from "../../services/notificationPreferences.service";
import type { NotificationPreferences } from "../../services/notificationPreferences.service";
import { useUnits } from "../../context/UnitContext";
import { UNIT_OPTIONS } from "../../utils/unitConversion";
import { ChevronDown } from "lucide-react";

// Parameters that have configurable units (water quality params with >1 unit option)
const UNIT_SETTINGS = [
  { key: "temperature", label: "Temperature" },
  { key: "depth",       label: "Water Depth" },
];

export default function SettingsPage() {
  const { units, setUnit, resetUnits } = useUnits();
  const [view, setView] = useState<"graph" | "table">("graph");

  // Notification preferences state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<
    Partial<NotificationPreferences>
  >({
    notifyInApp: true,
    notifyEmail: false,
    notifyTelegram: false,
    emailAddress: "",
    telegramChatId: "",
  });
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  // Unit save feedback
  const [unitSaveMessage, setUnitSaveMessage] = useState("");

  // Load notification preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await notificationPreferencesService.getPreferences();
        setNotificationPrefs(prefs);
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setPreferencesLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Save notification preferences
  const handleSavePreferences = async () => {
    setSaving(true);
    setSaveMessage("");

    try {
      await notificationPreferencesService.updatePreferences(notificationPrefs);
      setSaveMessage("Preferences saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      setSaveMessage("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  // Test Telegram notification
  const handleTestTelegram = async () => {
    if (!notificationPrefs.telegramChatId) return;

    setTestingTelegram(true);
    setTelegramTestResult(null);

    try {
      const result = await notificationPreferencesService.testTelegram(
        notificationPrefs.telegramChatId,
      );
      setTelegramTestResult(result);
      setTimeout(() => setTelegramTestResult(null), 5000);
    } catch (error: any) {
      setTelegramTestResult({
        success: false,
        error:
          error.response?.data?.error || "Failed to send test notification",
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleUnitChange = (parameter: string, unit: string) => {
    setUnit(parameter, unit);
    setUnitSaveMessage("Units updated and saved automatically");
    setTimeout(() => setUnitSaveMessage(""), 2000);
  };

  const formatOptionLabel = (param: string, option: string): string => {
    if (param === "temperature") {
      if (option === "°C") return "Celsius (°C)";
      if (option === "°F") return "Fahrenheit (°F)";
    }
    if (param === "depth") {
      if (option === "m") return "Meters (m)";
      if (option === "ft") return "Feet (ft)";
    }
    return option;
  };

  return (
    <div className="flex bg-[#ffffff] min-h-screen text-slate-700 w-screen max-w-screen overflow-x-hidden">
      <Sidebar active="Settings" isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="flex flex-col flex-1">
        <Topbar title="Settings" view={view} setView={setView} onMenuToggle={() => setSidebarOpen(true)} />

        <div className="p-6 flex flex-col gap-6">
          {/* Units Section */}
          <Card title="Measurement Units">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {UNIT_SETTINGS.map(({ key, label }) => {
                const options = UNIT_OPTIONS[key] || [];
                if (options.length <= 1) return null;

                const currentValue = units[key] || options[0];

                return (
                  <div key={key}>
                    <label className="block mb-1 text-sm text-slate-700">
                      {label}
                    </label>
                    <div className="relative">
                      <select
                        value={currentValue}
                        onChange={(e) => handleUnitChange(key, e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-lg bg-[#ffffff] text-sm border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none"
                      >
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {formatOptionLabel(key, option)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reset & Feedback */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  resetUnits();
                  setUnitSaveMessage("Units reset to defaults");
                  setTimeout(() => setUnitSaveMessage(""), 2000);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-sm transition-colors"
              >
                Reset to Defaults
              </button>
              {unitSaveMessage && (
                <div className="flex items-center text-sm text-emerald-600">
                  ✓ {unitSaveMessage}
                </div>
              )}
            </div>
          </Card>

          {/* Notification Preferences Section */}
          <Card title="Notification Preferences">
            <div className="space-y-6">
              {preferencesLoading && (
                <div className="text-sm text-slate-500">
                  Loading preferences...
                </div>
              )}

              {/* In-App Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    In-App Notifications
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    Get notified within the dashboard
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotificationPrefs((prev) => ({
                      ...prev,
                      notifyInApp: !prev.notifyInApp,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationPrefs.notifyInApp
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationPrefs.notifyInApp
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Email Notifications
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Receive alerts via email
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotificationPrefs((prev) => ({
                        ...prev,
                        notifyEmail: !prev.notifyEmail,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationPrefs.notifyEmail
                        ? "bg-blue-600"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationPrefs.notifyEmail
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                {notificationPrefs.notifyEmail && (
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={notificationPrefs.emailAddress || ""}
                    onChange={(e) =>
                      setNotificationPrefs((prev) => ({
                        ...prev,
                        emailAddress: e.target.value,
                      }))
                    }
                    className="bg-[#ffffff] px-3 py-2 border border-slate-200 rounded-lg w-full text-sm"
                  />
                )}
              </div>

              {/* Telegram Notifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Telegram Notifications
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Get alerts on Telegram
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotificationPrefs((prev) => ({
                        ...prev,
                        notifyTelegram: !prev.notifyTelegram,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationPrefs.notifyTelegram
                        ? "bg-blue-600"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationPrefs.notifyTelegram
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                {notificationPrefs.notifyTelegram && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Telegram Chat ID"
                        value={notificationPrefs.telegramChatId || ""}
                        onChange={(e) =>
                          setNotificationPrefs((prev) => ({
                            ...prev,
                            telegramChatId: e.target.value,
                          }))
                        }
                        className="bg-[#ffffff] px-3 py-2 border border-slate-200 rounded-lg flex-1 text-sm"
                      />
                      <button
                        onClick={handleTestTelegram}
                        disabled={
                          !notificationPrefs.telegramChatId || testingTelegram
                        }
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                      >
                        {testingTelegram ? "Testing..." : "Test"}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Need help? Follow our{" "}
                      <Link
                        to="/telegram-setup"
                        className="text-blue-600 hover:underline"
                      >
                        setup guide
                      </Link>{" "}
                      to get your Chat ID
                    </p>
                    {telegramTestResult && (
                      <div
                        className={`text-xs p-2 rounded ${
                          telegramTestResult.success
                            ? "bg-emerald-900/30 text-emerald-600"
                            : "bg-red-900/30 text-red-600"
                        }`}
                      >
                        {telegramTestResult.success
                          ? "✓ Test notification sent successfully!"
                          : `✗ Error: ${telegramTestResult.error}`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
                {saveMessage && (
                  <div className="flex items-center text-sm text-emerald-600">
                    ✓ {saveMessage}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
