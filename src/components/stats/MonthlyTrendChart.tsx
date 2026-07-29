"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MonthCount } from "@/lib/bookStats";

function formatMonth(month: string) {
  const [, m] = month.split("-");
  return `${Number(m)}月`;
}

export function MonthlyTrendChart({
  data,
  unit = "本",
  seriesLabel = "完成本數",
  height = 260,
}: {
  data: MonthCount[];
  unit?: string;
  seriesLabel?: string;
  height?: number | `${number}%`;
}) {
  return (
    <div className="viz-root flex h-full min-h-0 flex-col" data-palette="reading-track">
      <style>{`
        .viz-root {
          color-scheme: light;
          --surface-1: #fcfcfb;
          --text-primary: #0b0b0b;
          --text-secondary: #52514e;
          --muted: #898781;
          --grid: #e1e0d9;
          --series-1: #184f95;
        }
      `}</style>
      <div className="min-h-0 flex-1">
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
            labelFormatter={(label) => label as string}
            contentStyle={{
              background: "var(--surface-1)",
              border: "1px solid var(--grid)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(value) => [`${value ?? 0} ${unit}`, seriesLabel]}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--series-1)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
