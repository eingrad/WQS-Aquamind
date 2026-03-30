// components/charts/AnalyticsChart.tsx
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
  "#14b8a6", // Teal
  "#a855f7", // Purple
  "#f97316", // Orange
  "#eab308", // Yellow
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f43f5e", // Rose
];

export default function AnalyticsChart({ data, params }: Props) {
  return (
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

        {params.map((param, index) => {
          const color = PARAM_COLORS[index % PARAM_COLORS.length];

          return (
            <Line
              key={param}
              type="linear"
              dataKey={param}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 5, stroke: color, strokeWidth: 2, fill: color }}
              name={param.toUpperCase()}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
