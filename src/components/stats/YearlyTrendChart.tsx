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
  height = 260,
}: {
  data: YearCount[];
  quarterlyData: QuarterCount[];
  height?: number | `${number}%`;
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

      <div className="mb-3 flex shrink-0 justify-end gap-1">
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
          累積總數
        </button>
      </div>

      <div className="min-h-0 flex-1">
      <ResponsiveContainer width="100%" height={height}>
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
            {/* 資料點仍是每季，但只在每年第一季標出年份，其餘留刻度線就好 */}
            <XAxis
              dataKey="quarter"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--grid)" }}
              tickLine={{ stroke: "var(--grid)" }}
              interval={0}
              tickFormatter={(value: string) =>
                value.endsWith("-Q1") ? value.slice(0, 4) : ""
              }
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
              labelFormatter={(label) => {
                const [year, q] = String(label).split("-Q");
                const endMonth = Number(q) * 3;
                return `${year} 年 ${endMonth - 2}–${endMonth} 月`;
              }}
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
    </div>
  );
}
