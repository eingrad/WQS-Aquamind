import { useState, useEffect } from "react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import Card from "../../components/widgets/Card";
import { notificationPreferencesService } from "../../services/notificationPreferences.service";
import type { NotificationPreferences } from "../../services/notificationPreferences.service";

type UnitKey = "temperature" | "windSpeed" | "so2" | "h2s" | "h2" | "solar";

export default function SettingsPage() {
  const [units, setUnits] = useState<Record<UnitKey, string>>({
    temperature: "°C",
    windSpeed: "m/s",
    so2: "µg/m³",
    h2s: "µg/m³",
    h2: "µg/m³",
    solar: "W/m²",
  });
  const [view, setView] = useState<"graph" | "table">("graph");

  // Notification preferences state
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

  const handleUnitChange = (key: UnitKey, value: string) => {
    setUnits((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex bg-[#0f1a1a] min-h-screen text-gray-100 w-screen max-w-screen overflow-x-hidden">
      <Sidebar active="Settings" />
      <div className="flex flex-col flex-1">
        <Topbar title="Settings" view={view} setView={setView} />

        <div className="p-6 flex flex-col gap-6">
          {/* Units Section */}
          <Card title="Measurement Units">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* H2S */}
              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  Hydrogen Sulfide (H₂S)
                </label>
                <select
                  value={units.h2s}
                  onChange={(e) => handleUnitChange("h2", e.target.value)}
                  className="bg-[#0d1717] px-3 py-2 border border-white/10 rounded-lg w-full text-sm"
                >
                  <option value="µg/m³">µg/m³</option>
                  <option value="ppm">ppm</option>
                  <option value="ppb">ppb</option>
                </select>
              </div>

              {/* SO₂ */}
              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  Sulfur Dioxide (SO₂)
                </label>
                <select
                  value={units.so2}
                  onChange={(e) => handleUnitChange("so2", e.target.value)}
                  className="bg-[#0d1717] px-3 py-2 border border-white/10 rounded-lg w-full text-sm"
                >
                  <option value="µg/m³">µg/m³</option>
                  <option value="ppm">ppm</option>
                  <option value="ppb">ppb</option>
                </select>
              </div>

              {/* H₂ */}
              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  Nitrogen Dioxide (NO₂)
                </label>
                <select
                  value={units.h2}
                  onChange={(e) => handleUnitChange("h2", e.target.value)}
                  className="bg-[#0d1717] px-3 py-2 border border-white/10 rounded-lg w-full text-sm"
                >
                  <option value="µg/m³">µg/m³</option>
                  <option value="ppm">ppm</option>
                  <option value="ppb">ppb</option>
                </select>
              </div>

              {/* BTEX */}
              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  Benzene, Toluene, Ethylbenzene, Xylene (BTEX)
                </label>
                <select
                  value={units.h2}
                  onChange={(e) => handleUnitChange("h2", e.target.value)}
                  className="bg-[#0d1717] px-3 py-2 border border-white/10 rounded-lg w-full text-sm"
                >
                  <option value="µg/m³">µg/m³</option>
                  <option value="ppm">ppm</option>
                  <option value="ppb">ppb</option>
                </select>
              </div>

              {/* Solar Radiation */}
              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  Solar Radiation
                </label>
                <select
                  value={units.solar}
                  onChange={(e) => handleUnitChange("solar", e.target.value)}
                  className="bg-[#0d1717] px-3 py-2 border border-white/10 rounded-lg w-full text-sm"
                >
                  <option value="W/m²">W/m²</option>
                  <option value="kWh/m²">kWh/m²</option>
                </select>
              </div>

              {/* Temperature */}
              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  Temperature
                </label>
                <select
                  value={units.temperature}
                  onChange={(e) =>
                    handleUnitChange("temperature", e.target.value)
                  }
                  className="bg-[#0d1717] px-3 py-2 border border-white/10 rounded-lg w-full text-sm"
                >
                  <option value="°C">Celsius (°C)</option>
                  <option value="°F">Fahrenheit (°F)</option>
                </select>
              </div>

              {/* Wind Speed */}
              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  Wind Speed
                </label>
                <select
                  value={units.windSpeed}
                  onChange={(e) =>
                    handleUnitChange("windSpeed", e.target.value)
                  }
                  className="bg-[#0d1717] px-3 py-2 border border-white/10 rounded-lg w-full text-sm"
                >
                  <option value="m/s">m/s</option>
                  <option value="km/h">km/h</option>
                  <option value="mph">mph</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Notification Preferences Section */}
          <Card title="Notification Preferences">
            <div className="space-y-6">
              {/* Loading state */}
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
                      <a
                        href="https://t.me/userinfobot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        setup guide
                      </a>{" "}
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
