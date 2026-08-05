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
import { QuarterCount } from "@/lib/bookStats";
import { VIZ_TOKENS } from "@/lib/chartPalette";

/** 每一季只在第一季標出年份，其餘留刻度線就好，不然 X 軸會擠成一團 */
function quarterTick(value: string) {
  return value.endsWith("-Q1") ? value.slice(0, 4) : "";
}

function quarterLabel(label: unknown) {
  const [year, q] = String(label).split("-Q");
  const endMonth = Number(q) * 3;
  return `${year} 年 ${endMonth - 2}–${endMonth} 月`;
}

export function YearlyTrendChart({
  quarterlyData,
  height = 260,
}: {
  quarterlyData: QuarterCount[];
  height?: number | `${number}%`;
}) {
  const [mode, setMode] = useState<"quarterly" | "cumulative">("quarterly");

  const cumulativeData = useMemo(
    () =>
      quarterlyData.reduce<Array<{ quarter: string; total: number }>>((acc, d) => {
        const previous = acc.length > 0 ? acc[acc.length - 1].total : 0;
        acc.push({ quarter: d.quarter, total: previous + d.count });
        return acc;
      }, []),
    [quarterlyData]
  );

  if (quarterlyData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        尚無完成日期資料
      </div>
    );
  }

  return (
    <div className="viz-root flex h-full min-h-0 flex-col" data-palette="reading-track">
      <style>{`.viz-root {${VIZ_TOKENS}}`}</style>

      <div className="mb-3 flex shrink-0 justify-end gap-1">
        <button
          onClick={() => setMode("quarterly")}
          className={`rounded px-2 py-1 text-xs font-medium ${
            mode === "quarterly"
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          每季新增
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
        {mode === "quarterly" ? (
          <BarChart data={quarterlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="3 3" />
            <XAxis
              dataKey="quarter"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--grid)" }}
              tickLine={{ stroke: "var(--grid)" }}
              interval={0}
              tickFormatter={quarterTick}
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
              labelFormatter={quarterLabel}
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
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--grid)" }}
              tickLine={{ stroke: "var(--grid)" }}
              interval={0}
              tickFormatter={quarterTick}
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
              labelFormatter={quarterLabel}
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
