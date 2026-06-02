import { EXPOSURE_RANGES, type AQIRange } from "../../data/aqiRanges";
import { useUnits } from "../../context/UnitContext";

interface ExposureLimitsDisplayProps {
  parameter: string;
}

export default function ExposureLimitsDisplay({
  parameter,
}: ExposureLimitsDisplayProps) {
  const { getUnit } = useUnits();
  const rangeData = EXPOSURE_RANGES[parameter];

  if (!rangeData) return null;

  const displayUnit = getUnit(parameter);

  const formatNumber = (val: number): string => {
    const abs = Math.abs(val);
    if (abs === 0) return "0";
    if (abs < 0.01) return val.toFixed(4);
    if (abs < 1) return val.toFixed(3);
    if (abs < 100) return val.toFixed(2);
    return val.toFixed(1);
  };

  const formatRange = (range: AQIRange): string => {
    const minStr = formatNumber(range.min);
    if (range.max === null) return `> ${minStr}`;
    return `${minStr} – ${formatNumber(range.max)}`;
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="text-sm font-semibold text-slate-700 px-2">
        NWQS Class Standards ({displayUnit})
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
            <span
              className="font-semibold text-sm min-w-[160px]"
              style={{ color: range.color }}
            >
              {range.category}
            </span>
            <span className="text-slate-500 text-sm">
              {formatRange(range)} {displayUnit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
