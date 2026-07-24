"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { QuarterCount, YearCount } from "@/lib/bookStats";

export function YearlyTrendChart({
  data,
  quarterlyData,
}: {
  data: YearCount[];
  quarterlyData: QuarterCount[];
}) {
  const [mode, setMode] = useState<"yearly" | "cumulative">("yearly");

  const cumulativeData = useMemo(() => {
    let running = 0;
    return quarterlyData.map((d) => {
      running += d.count;
      return { quarter: d.quarter, total: running };
    });
  }, [quarterlyData]);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        尚無完成日期資料
      </div>
    );
  }

  return (
    <div className="viz-root" data-palette="reading-track">
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

      <div className="mb-3 flex justify-end gap-1">
        <button
          onClick={() => setMode("yearly")}
          className={`rounded px-2 py-1 text-xs font-medium ${
            mode === "yearly"
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          每年新增
        </button>
        <button
          onClick={() => setMode("cumulative")}
          className={`rounded px-2 py-1 text-xs font-medium ${
            mode === "cumulative"
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          累積總數（每季）
        </button>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        {mode === "yearly" ? (
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--grid)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              cursor={{ fill: "rgba(11,11,11,0.04)" }}
              contentStyle={{
                background: "var(--surface-1)",
                border: "1px solid var(--grid)",
                borderRadius: 6,
                fontSize: 12,
              }}
              formatter={(value) => [`${value ?? 0} 本`, "完成本數"]}
            />
            <Bar dataKey="count" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        ) : (
          <AreaChart data={cumulativeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cumulativeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="3 3" />
            <XAxis
              dataKey="quarter"
              tick={{ fill: "var(--muted)", fontSize: 10 }}
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
              formatter={(value) => [`${value ?? 0} 本`, "累積完成"]}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--series-1)"
              strokeWidth={2}
              fill="url(#cumulativeFill)"
              dot={{ r: 2, fill: "var(--series-1)" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
