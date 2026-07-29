"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FolderMonthPoint, FolderSeries } from "@/lib/articleStats";

const CATEGORICAL = [
  "#184f95",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
];

function formatMonth(month: string) {
  const [, m] = month.split("-");
  return `${Number(m)}月`;
}

export function FolderTrendChart({
  data,
  series,
  height = 280,
}: {
  data: FolderMonthPoint[];
  series: FolderSeries[];
  height?: number | `${number}%`;
}) {
  if (series.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-sm text-gray-400">
        尚無資料
      </div>
    );
  }

  return (
    <div className="viz-root" data-palette="reading-track">
      <style>{`
        .viz-root {
          color-scheme: light;
          --surface-1: #fcfcfb;
          --text-secondary: #52514e;
          --muted: #898781;
          --grid: #e1e0d9;
        }
      `}</style>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--grid)" }}
            tickLine={false}
            interval={1}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-1)",
              border: "1px solid var(--grid)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(value, name) => [`${value ?? 0} 篇`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
          {series.map((s, i) => {
            const color = CATEGORICAL[i % CATEGORICAL.length];
            return (
              <Line
                key={s.completedKey}
                type="monotone"
                dataKey={s.completedKey}
                name={`${s.folder}（已讀完）`}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5 }}
              />
            );
          })}
          {series.map((s, i) => {
            const color = CATEGORICAL[i % CATEGORICAL.length];
            return (
              <Line
                key={s.incompleteKey}
                type="monotone"
                dataKey={s.incompleteKey}
                name={`${s.folder}（未讀完）`}
                stroke={color}
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
