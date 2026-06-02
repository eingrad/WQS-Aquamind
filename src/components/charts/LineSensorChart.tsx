// components/charts/LineSensorChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import ExposureLimitsDisplay from "./ExposureLimitsDisplay";
import { formatSensorValue } from "../../utils/numberFormat";
import {
  formatChartAxisTime,
  formatChartTooltipDate,
} from "../../utils/dateFormat";

type Props = {
  data: any[];
  params: string[];
};

// Color palette for different parameters
const PARAM_COLORS = [
  "#2563eb", // Teal
  "#a855f7", // Purple
  "#f97316", // Orange
  "#eab308", // Yellow
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#ef4444", // Red
];

export default function LineSensorChart({ data, params }: Props) {
  return (
    <>
      <div className="h-94">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              tickMargin={10}
              dataKey="t"
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              axisLine={true}
              tickLine={true}
              tickFormatter={(value) => formatChartAxisTime(value)}
            />
            <YAxis
              tickMargin={15}
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0b1111",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                fontSize: 11,
              }}
              labelStyle={{ color: "#9ca3af", fontSize: 13 }}
              itemStyle={{ fontSize: 13 }}
              formatter={(value: any) => {
                if (typeof value === "number") {
                  return formatSensorValue(value, 2);
                }
                return value;
              }}
              labelFormatter={(value) => formatChartTooltipDate(value)}
            />
            {/* Only show legend when multiple parameters are selected */}
            {params.length > 1 && (
              <Legend
                verticalAlign="bottom"
                height={60}
                wrapperStyle={{
                  color: "#e5e7eb",
                  fontSize: 13,
                  paddingTop: "20px",
                }}
              />
            )}

            {/* Render a Line for each selected parameter */}
            {params.map((param, index) => {
              const color = PARAM_COLORS[index % PARAM_COLORS.length];

              return (
                <Line
                  key={param}
                  type="linear"
                  dataKey={param}
                  dot={{ r: 3, stroke: color, strokeWidth: 1 }}
                  stroke={color}
                  strokeWidth={2.5}
                  activeDot={{ r: 5 }}
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                  name={param.toUpperCase()}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Show exposure ranges when single parameter is selected */}
      {params.length === 1 && <ExposureLimitsDisplay parameter={params[0]} />}
    </>
  );
}
