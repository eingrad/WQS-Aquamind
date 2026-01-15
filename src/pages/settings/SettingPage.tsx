import { useState } from "react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import Card from "../../components/widgets/Card";

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

          {/* Profile Section (you can expand this later) */}
          <Card title="Profile">
            <p className="text-sm text-gray-400">
              Edit profile features coming soon.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
