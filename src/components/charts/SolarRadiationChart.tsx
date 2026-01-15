// src/components/charts/SolarRadiationChart.tsx
import Plot from "react-plotly.js";

export default function SolarRadiationChart() {
  const data = [
    { time: "06:00", value: 0 },
    { time: "07:00", value: 50 },
    { time: "08:00", value: 150 },
    { time: "09:00", value: 300 },
    { time: "10:00", value: 500 },
    { time: "11:00", value: 700 },
    { time: "12:00", value: 900 },
    { time: "13:00", value: 850 },
    { time: "14:00", value: 700 },
    { time: "15:00", value: 500 },
    { time: "16:00", value: 300 },
    { time: "17:00", value: 100 },
    { time: "18:00", value: 20 },
    { time: "19:00", value: 0 },
  ];

  return (
    <Plot
      data={[
        {
          x: data.map((d) => d.time),
          y: data.map((d) => d.value),
          type: "scatter",
          mode: "lines+markers",
          fill: "tozeroy",
          name: "Solar Radiation",
          line: { color: "#facc15", width: 3 },
          marker: { color: "#facc15" },
        },
      ]}
      layout={{
        title: { text: "Solar Radiation (W/m²)" },
        xaxis: { title: { text: "Time" }, tickfont: { color: "#cbd5e1" } },
        yaxis: {
          title: { text: "Radiation (W/m²)" },
          range: [0, 1000],
          tickfont: { color: "#cbd5e1" },
        },
        plot_bgcolor: "#0f1a1a",
        paper_bgcolor: "#0f1a1a",
        font: { color: "#f8fafc" },
        margin: { t: 40, b: 40, l: 60, r: 30 },
      }}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
      config={{ responsive: true }}
    />
  );
}