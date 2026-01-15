// src/data/windRose.ts
import type { ChartData } from "@eunchurn/react-windrose";
import { WIND_DIRS, WINDROSE_BIN_KEYS } from "./constants";

export function makeWindRoseData(): {
  chartData: ChartData[];
  columns: (keyof ChartData)[];
} {
  const chartData: ChartData[] = WIND_DIRS.map((dir, i) => {
    const row: ChartData = {
      angle: dir as ChartData["angle"],
      "0-1": 0,
      "1-2": 0,
      "2-3": 0,
      "3-4": 0,
      "4-5": 0,
      "5-6": 0,
      "6-7": 0,
      "7+": 0,
      total: 0,
    };

    let tot = 0;
    WINDROSE_BIN_KEYS.forEach((k, kIdx) => {
      // Create synthetic wind speed variation pattern
      const v = Math.max(
        0,
        5 + Math.sin((i + kIdx) / 2) * 3 + (Math.random() - 0.5) * 2
      );
      (row as any)[k] = Number(v.toFixed(2));
      tot += v;
    });

    row.total = Number(tot.toFixed(2));
    return row;
  });

  const columns = ["angle", ...WINDROSE_BIN_KEYS] as (keyof ChartData)[];
  return { chartData, columns };
}
