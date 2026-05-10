import { EXPOSURE_RANGES, type AQIRange } from "../../data/aqiRanges";
import { useUnits } from "../../context/UnitContext";
import { convertValue } from "../../utils/unitConversion";

interface ExposureLimitsDisplayProps {
  parameter: string;
}

/**
 * Renders the AQI threshold table for a parameter. Range bounds are stored
 * in the parameter's base unit (ppb for gases, W/m² for solar) and converted
 * here to whatever unit the user has selected — so the table always matches
 * the chart's axis unit.
 */
export default function ExposureLimitsDisplay({
  parameter,
}: ExposureLimitsDisplayProps) {
  const { getUnit } = useUnits();
  const rangeData = EXPOSURE_RANGES[parameter];

  if (!rangeData) {
    return null;
  }

  const displayUnit = getUnit(parameter);

  const convert = (val: number): number => {
    if (rangeData.baseUnit === displayUnit) return val;
    const out = convertValue(val, parameter, displayUnit);
    return out ?? val;
  };

  const formatNumber = (val: number): string => {
    const abs = Math.abs(val);
    if (abs === 0) return "0";
    if (abs < 0.01) return val.toFixed(4);
    if (abs < 1) return val.toFixed(3);
    if (abs < 100) return val.toFixed(2);
    return val.toFixed(1);
  };

  const formatRange = (range: AQIRange): string => {
    const minStr = formatNumber(convert(range.min));
    if (range.max === null) return `> ${minStr}`;
    const maxStr = formatNumber(convert(range.max));
    return `${minStr} - ${maxStr}`;
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="text-sm font-semibold text-gray-300 px-2">
        Parameters Thresholds Limits ({displayUnit})
      </div>

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
              {formatRange(range)} {displayUnit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
