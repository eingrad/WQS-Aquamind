import { useEffect, useState } from "react";
import { PARAMETERS } from "../../data/constants";
import { getRealTimeParams } from "../../services/liveData.service";
import { getLatestReadings } from "../../services/telemetry.service";
import { useUnits } from "../../context/UnitContext";
import { formatPollutantValue } from "../../utils/numberFormat";

interface GaugeWidgetProps {
  deviceId: string;
  parameter: string;
}

export default function GaugeWidget({ deviceId, parameter }: GaugeWidgetProps) {
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { convert, getUnit } = useUnits();

  const paramMeta = PARAMETERS.find((p) => p.key === parameter);

  useEffect(() => {
    if (!deviceId) return;

    const fetchData = async () => {
      try {
        const data = await getRealTimeParams(deviceId);
        const entry = data.readings[parameter];
        if (entry !== undefined) {
          setValue(entry.value);
        }
      } catch {
        try {
          const readings = await getLatestReadings(deviceId, 1);
          if (readings.length > 0) {
            const keyMap: Record<string, string> = {
              ph:          "phValue",
              do:          "doValue",
              nh3n:        "nh3nValue",
              cod:         "codValue",
              bod:         "bodValue",
              tss:         "tssValue",
              temperature: "tempValue",
              pressure:    "pressureValue",
              depth:       "depthValue",
            };
            const dbKey = keyMap[parameter];
            if (dbKey && readings[0][dbKey]) {
              setValue(parseFloat(readings[0][dbKey]));
            }
          }
        } catch (err) {
          console.error("Gauge: fallback fetch failed", err);
        }
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [deviceId, parameter]);

  // Gauge configuration per parameter
  // Gauge zones based on Malaysia NWQS Class II limits
  const getGaugeConfig = () => {
    const configs: Record<
      string,
      { max: number; zones: [number, number, string][] }
    > = {
      ph: {
        max: 14,
        zones: [
          [0,  6,  "#ef4444"], // below Class II (acidic)
          [6,  9,  "#10b981"], // Class II range
          [9,  14, "#ef4444"], // above Class II (alkaline)
        ],
      },
      do: {
        max: 20,
        zones: [
          [0,  3,  "#ef4444"], // critically low
          [3,  5,  "#f59e0b"], // below Class II limit
          [5,  20, "#10b981"], // Class II (≥5 mg/L)
        ],
      },
      nh3n: {
        max: 2,
        zones: [
          [0,    0.2,  "#10b981"], // normal
          [0.2,  0.3,  "#f59e0b"], // approaching limit
          [0.3,  2,    "#ef4444"], // exceeds Class II (0.3 mg/L)
        ],
      },
      cod: {
        max: 100,
        zones: [
          [0,  20, "#10b981"], // normal
          [20, 25, "#f59e0b"], // approaching limit
          [25, 100,"#ef4444"], // exceeds Class II (25 mg/L)
        ],
      },
      bod: {
        max: 20,
        zones: [
          [0,   2.5, "#10b981"], // normal
          [2.5, 3,   "#f59e0b"], // approaching limit
          [3,   20,  "#ef4444"], // exceeds Class II (3 mg/L)
        ],
      },
      tss: {
        max: 200,
        zones: [
          [0,  40,  "#10b981"], // normal
          [40, 50,  "#f59e0b"], // approaching limit
          [50, 200, "#ef4444"], // exceeds Class II (50 mg/L)
        ],
      },
      temperature: {
        max: 50,
        zones: [
          [0,  20, "#3b82f6"], // cool
          [20, 30, "#10b981"], // normal
          [30, 50, "#f59e0b"], // warm / high
        ],
      },
      pressure: {
        max: 120,
        zones: [
          [80,  95,  "#f59e0b"], // low
          [95,  106, "#10b981"], // normal
          [106, 120, "#f59e0b"], // high
        ],
      },
      depth: {
        max: 50,
        zones: [
          [0,  2,  "#f59e0b"], // very shallow
          [2,  30, "#10b981"], // normal
          [30, 50, "#3b82f6"], // deep
        ],
      },
    };
    return (
      configs[parameter] || {
        max: 100,
        zones: [
          [0,  33, "#10b981"],
          [33, 66, "#f59e0b"],
          [66, 100,"#ef4444"],
        ],
      }
    );
  };

  const config = getGaugeConfig();
  const displayValue =
    value !== null ? (convert(value, parameter) ?? value) : 0;
  const formattedValue =
    value !== null ? formatPollutantValue(displayValue, parameter) : "--";
  const unit = getUnit(parameter);
  const percentage =
    value !== null ? Math.min(Math.max(value / config.max, 0), 1) : 0;

  // SVG arc gauge
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -225;
  const endAngle = 45;
  const totalArc = endAngle - startAngle; // 270 degrees

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  // Get current color based on value
  const getCurrentColor = () => {
    if (value === null) return "#374151";
    for (const [min, max, color] of config.zones) {
      if (value >= min && value <= max) return color;
    }
    return "#ef4444";
  };

  const needleAngle = startAngle + percentage * totalArc;
  const needleEnd = polarToCartesian(needleAngle);

  if (loading) {
    return (
      <div className="bg-[#0d1717] border border-white/10 rounded-xl p-6 flex items-center justify-center h-[280px]">
        <div className="text-teal-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1717] border border-white/10 rounded-xl p-6 flex flex-col items-center">
      <h3 className="text-white/70 text-sm font-medium mb-2">
        {paramMeta?.label || parameter}
      </h3>

      <svg
        width={size}
        height={size * 0.7}
        viewBox={`0 0 ${size} ${size * 0.85}`}
      >
        {/* Background arc */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="#1f2937"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored zone arcs */}
        {config.zones.map(([min, max, color], i) => {
          const zoneStart = startAngle + (min / config.max) * totalArc;
          const zoneEnd = startAngle + (max / config.max) * totalArc;
          return (
            <path
              key={i}
              d={describeArc(zoneStart, zoneEnd)}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={0.3}
            />
          );
        })}

        {/* Active arc (value indicator) */}
        {value !== null && (
          <path
            d={describeArc(startAngle, needleAngle)}
            fill="none"
            stroke={getCurrentColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: "d 1s ease-out" }}
          />
        )}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={getCurrentColor()}
          strokeWidth={3}
          strokeLinecap="round"
          style={{ transition: "all 1s ease-out" }}
        />
        <circle cx={cx} cy={cy} r={6} fill={getCurrentColor()} />
        <circle cx={cx} cy={cy} r={3} fill="#0d1717" />

        {/* Value text */}
        <text
          x={cx}
          y={cy + 30}
          textAnchor="middle"
          className="text-2xl font-bold"
          fill="white"
        >
          {formattedValue}
        </text>
        <text
          x={cx}
          y={cy + 48}
          textAnchor="middle"
          className="text-xs"
          fill="#9ca3af"
        >
          {unit}
        </text>
      </svg>
    </div>
  );
}
