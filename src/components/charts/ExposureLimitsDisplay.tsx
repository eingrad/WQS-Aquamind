import { EXPOSURE_RANGES } from "../../data/aqiRanges";

interface ExposureLimitsDisplayProps {
  parameter: string;
}

/**
 * ExposureLimitsDisplay Component
 *
 * Displays color-coded AQI (Air Quality Index) ranges for a specific pollutant parameter.
 * Shows concentration ranges, categories (Good to Hazardous), and API values based on
 * Malaysian Department of Environment standards.
 *
 * @param parameter - The pollutant parameter key (e.g., 'so2', 'no2', 'h2s')
 */
export default function ExposureLimitsDisplay({
  parameter,
}: ExposureLimitsDisplayProps) {
  const rangeData = EXPOSURE_RANGES[parameter];

  // Don't render if no range data exists for this parameter
  if (!rangeData) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Title */}
      <div className="text-sm font-semibold text-gray-300 px-2">
        Parameters Thresholds Limits ({rangeData.unit})
      </div>

      {/* Color-coded ranges - horizontal bar */}
      <div className="flex flex-col gap-0.5">
        {rangeData.ranges.map((range, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-4 py-2.5 rounded"
            style={{
              backgroundColor: range.bgColor,
              borderLeft: `4px solid ${range.color}`,
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="font-semibold text-sm min-w-[120px]"
                style={{ color: range.color }}
              >
                {range.category}
              </span>
            </div>
            <span className="text-gray-400 text-sm">
              {range.range} {rangeData.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
