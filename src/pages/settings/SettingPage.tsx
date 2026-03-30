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

// Parameters that have configurable units
const UNIT_SETTINGS = [
  { key: "so2", label: "Sulfur Dioxide (SO₂)" },
  { key: "h2s", label: "Hydrogen Sulfide (H₂S)" },
  { key: "no2", label: "Nitrogen Dioxide (NO₂)" },
  { key: "btex", label: "Benzene, Toluene, Ethylbenzene, Xylene (BTEX)" },
  { key: "solar", label: "Solar Radiation" },
  { key: "temperature", label: "Temperature" },
  { key: "windSpeed", label: "Wind Speed" },
  { key: "humidity", label: "Humidity" },
  { key: "windDirection", label: "Wind Direction" },
  { key: "pressure", label: "Atmospheric Pressure" },
  { key: "rain", label: "Rainfall" },
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

  // Handle unit change with feedback
  const handleUnitChange = (parameter: string, unit: string) => {
    setUnit(parameter, unit);
    setUnitSaveMessage("Units updated and saved automatically");
    setTimeout(() => setUnitSaveMessage(""), 2000);
  };

  // Format option labels for better readability
  const formatOptionLabel = (param: string, option: string): string => {
    if (param === "so2") {
      if (option === "ppm") return "Parts per million (ppm)";
      if (option === "ppb") return "Parts per billion (ppb)";
      if (option === "µg/m³") return "Micrograms per cubic meter (µg/m³)";
    }
    if (param === "h2s") {
      if (option === "ppm") return "Parts per million (ppm)";
      if (option === "ppb") return "Parts per billion (ppb)";
      if (option === "µg/m³") return "Micrograms per cubic meter (µg/m³)";
    }
    if (param === "no2") {
      if (option === "ppm") return "Parts per million (ppm)";
      if (option === "ppb") return "Parts per billion (ppb)";
      if (option === "µg/m³") return "Micrograms per cubic meter (µg/m³)";
    }
    if (param === "btex") {
      if (option === "ppm") return "Parts per million (ppm)";
      if (option === "ppb") return "Parts per billion (ppb)";
      if (option === "µg/m³") return "Micrograms per cubic meter (µg/m³)";
    }
    if (param === "solar") {
      if (option === "W/m²") return "Watts per square meter (W/m²)";
      if (option === "kWh/m²")
        return "Kilowatt-hours per square meter (kWh/m²)";
    }
    if (param === "temperature") {
      if (option === "°C") return "Celsius (°C)";
      if (option === "°F") return "Fahrenheit (°F)";
    }
    if (param === "windSpeed") {
      if (option === "m/s") return "Meters per second (m/s)";
      if (option === "km/h") return "Kilometers per hour (km/h)";
      if (option === "mph") return "Miles per hour (mph)";
    }
    if (param === "windDirection") {
      if (option === "°") return "Degrees (°)";
      if (option === "Cardinal") return "Cardinal (N, NE, E…)";
    }
    if (param === "humidity") {
      if (option === "%") return "Relative Humidity (%)";
      if (option === "g/m³") return "Absolute Humidity (g/m³)";
    }
    if (param === "pressure") {
      if (option === "hPa") return "Hectopascal (hPa)";
      if (option === "mmHg") return "Millimeters of Mercury (mmHg)";
      if (option === "atm") return "Atmospheres (atm)";
      if (option === "psi") return "Pounds per sq inch (psi)";
    }
    if (param === "rain") {
      if (option === "mm/h") return "Millimeters per hour (mm/h)";
      if (option === "in/h") return "Inches per hour (in/h)";
    }
    return option;
  };

  return (
    <div className="flex bg-[#0f1a1a] min-h-screen text-gray-100 w-screen max-w-screen overflow-x-hidden">
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

                return (
                  <div key={key}>
                    <label className="block mb-1 text-sm text-gray-300">
                      {label}
                    </label>
                    <div className="relative">
                      <select
                        value={units[key] || options[0]}
                        onChange={(e) => handleUnitChange(key, e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-lg bg-[#0d1717] text-sm border border-white/10 hover:border-teal-500/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 cursor-pointer appearance-none min-w-[180px] hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none"
                      >
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {formatOptionLabel(key, option)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 pointer-events-none" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reset & Feedback */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  resetUnits();
                  setUnitSaveMessage("Units reset to defaults");
                  setTimeout(() => setUnitSaveMessage(""), 2000);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                Reset to Defaults
              </button>
              {unitSaveMessage && (
                <div className="flex items-center text-sm text-emerald-400">
                  ✓ {unitSaveMessage}
                </div>
              )}
            </div>
          </Card>

          {/* Notification Preferences Section */}
          <Card title="Notification Preferences">
            <div className="space-y-6">
              {preferencesLoading && (
                <div className="text-sm text-gray-400">
                  Loading preferences...
                </div>
              )}

              {/* In-App Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-200">
                    In-App Notifications
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
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
                      ? "bg-emerald-600"
                      : "bg-gray-600"
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
                    <label className="block text-sm font-medium text-gray-200">
                      Email Notifications
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
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
                        ? "bg-emerald-600"
                        : "bg-gray-600"
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
                    className="bg-[#0d1717] px-3 py-2 border border-white/10 rounded-lg w-full text-sm"
                  />
                )}
              </div>

              {/* Telegram Notifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-200">
                      Telegram Notifications
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
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
                        ? "bg-emerald-600"
                        : "bg-gray-600"
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
                        className="bg-[#0d1717] px-3 py-2 border border-white/10 rounded-lg flex-1 text-sm"
                      />
                      <button
                        onClick={handleTestTelegram}
                        disabled={
                          !notificationPrefs.telegramChatId || testingTelegram
                        }
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                      >
                        {testingTelegram ? "Testing..." : "Test"}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Need help? Follow our{" "}
                      <Link
                        to="/telegram-setup"
                        className="text-blue-400 hover:underline"
                      >
                        setup guide
                      </Link>{" "}
                      to get your Chat ID
                    </p>
                    {telegramTestResult && (
                      <div
                        className={`text-xs p-2 rounded ${
                          telegramTestResult.success
                            ? "bg-emerald-900/30 text-emerald-400"
                            : "bg-red-900/30 text-red-400"
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
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
                {saveMessage && (
                  <div className="flex items-center text-sm text-emerald-400">
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
