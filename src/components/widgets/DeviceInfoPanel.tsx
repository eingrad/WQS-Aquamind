import DeviceImage from "../../assets/pengerang.jpg";

export default function DeviceInfoPanel({
  device,
  onClose,
}: {
  device: any;
  onClose: () => void;
}) {
  if (!device) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-full sm:w-[250px] xl:w-[280px] bg-[#111a1a] border border-white/5 z-[999] overflow-y-auto">
      <div className="p-4">
        {/* Header with Close Button */}
        <div className="flex justify-between items-center mb-3">
          <div className="font-bold text-lg">Device Information</div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-400 transition text-xl font-semibold"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <img
          src={DeviceImage}
          alt="Device Preview"
          className="w-60 h-auto rounded-xl mb-4"
        />

        <div className="space-y-4 text-sm mb-5">
          <div className="flex justify-between flex-wrap">
            <b>Device ID</b>
            <span className="text-right">{device.id}</span>
          </div>
          <div className="flex justify-between flex-wrap">
            <b>Location</b>
            <span className="text-right">Pengerang</span>
          </div>
          <div className="flex justify-between flex-wrap">
            <b>Device Status</b>
            <span className="text-green-500 text-right">Online</span>
          </div>
          <div className="flex justify-between flex-wrap">
            <b>Longitude</b>
            <span className="text-right">1°21'59.7"N</span>
          </div>
          <div className="flex justify-between flex-wrap">
            <b>Latitude</b>
            <span className="text-right">104°06'29.8"E</span>
          </div>
        </div>

        <div className="mt-4 bg-[#1a2a2a] p-3 rounded-md w-full max-w-xs">
          <h3 className="font-semibold text-teal-400 mb-2">Parameters</h3>
          <div className="text-sm space-y-5">
            <div className="flex justify-between">
              <span>SO₂</span>
              <span>105.19 µg/m³</span>
            </div>
            <div className="flex justify-between">
              <span>H₂S</span>
              <span>10 µg/m³</span>
            </div>
            <div className="flex justify-between">
              <span>NO₂</span>
              <span>9.05 µg/m³</span>
            </div>
            <div className="flex justify-between">
              <span>BTEX</span>
              <span>12.5 µg/m³</span>
            </div>
            <div className="flex justify-between">
              <span>Wind Speed</span>
              <span>211.1 m/s</span>
            </div>
            <div className="flex justify-between">
              <span>Wind Direction</span>
              <span>36° (NNE)</span>
            </div>
            <div className="flex justify-between">
              <span>Rain</span>
              <span>1.0 mm</span>
            </div>
            <div className="flex justify-between">
              <span>Pressure</span>
              <span>1003 hPa</span>
            </div>
            <div className="flex justify-between">
              <span>Humidity</span>
              <span>20%</span>
            </div>
            <div className="flex justify-between">
              <span>Temperature</span>
              <span>27°C</span>
            </div>
            <div className="flex justify-between">
              <span>Solar Radiation</span>
              <span>543 W/m²</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
