"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PagerButton } from "@/components/ui/pager-button";
import { VIZ_TOKENS } from "@/utils/chartPalette";

export interface RangeOption {
  key: string;
  label: string;
  /** 看得到幾個資料點；0 代表全部 */
  size: number;
  /**
   * 這個區間要畫哪一組資料。
   *
   * 區間短的時候會換成比較細的刻度（例如季→月）：只看半年的話，
   * 兩根季長條看不出這半年發生什麼事。
   */
  data: TrendPoint[];
  /** dense＝這一段的根數少，標籤放得下完整寫法 */
  tick: (value: string, dense: boolean) => string;
  tooltipLabel: (value: string) => string;
}

export interface TrendPoint {
  /** X 軸的鍵，例如 2026-Q3 或 2026-08 */
  key: string;
  count: number;
}

/**
 * 有區間可選的長條趨勢圖。
 *
 * 用長條而不是折線：每一根是「那一段完成了幾本」，彼此獨立、沒有中間值，
 * 折線把它們連起來會暗示中間有連續變化，那是不存在的東西。
 *
 * 全部攤開時近期的起伏會被幾年的資料壓平，所以可以縮到半年再前後翻。
 */
export function RangedBarChart({
  ranges,
  unit,
  seriesLabel,
  emptyText = "尚無資料",
  height = 260,
}: {
  ranges: RangeOption[];
  unit: string;
  seriesLabel: string;
  emptyText?: string;
  height?: number | `${number}%`;
}) {
  const [rangeKey, setRangeKey] = useState(ranges[0]?.key ?? "all");
  /** 往前翻幾個區間，0 是最新的那一段 */
  const [offset, setOffset] = useState(0);

  const range = ranges.find((r) => r.key === rangeKey) ?? ranges[0];
  const data = range?.data ?? [];

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">{emptyText}</div>
    );
  }

  const size = range?.size ?? 0;
  const windowed = size > 0;
  // 從最新往回數：offset 個區間之前的那一段
  const end = windowed ? Math.max(size, data.length - offset * size) : data.length;
  const visible = windowed ? data.slice(Math.max(0, end - size), end) : data;
  const canGoBack = windowed && end - size > 0;

  function changeRange(key: string) {
    setRangeKey(key);
    setOffset(0); // 換區間就回到最新的那一段，不然會停在一段沒資料的過去
  }

  return (
    <div className="viz-root flex h-full min-h-0 flex-col gap-3" data-palette="reading-track">
      <style>{`.viz-root {${VIZ_TOKENS}}`}</style>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {windowed && (
          <div className="flex items-center gap-1">
            <PagerButton
              direction="prev"
              onClick={() => setOffset((o) => o + 1)}
              disabled={!canGoBack}
              label="前一段"
            />
            <PagerButton
              direction="next"
              onClick={() => setOffset((o) => Math.max(0, o - 1))}
              disabled={offset === 0}
              label="後一段"
            />
          </div>
        )}
        <div className="flex gap-1">
          {ranges.map((option) => (
            <button
              key={option.key}
              onClick={() => changeRange(option.key)}
              className={`rounded px-2 py-1 text-xs font-medium ${
                rangeKey === option.key
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={visible} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="3 3" />
            <XAxis
              dataKey="key"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--grid)" }}
              tickLine={{ stroke: "var(--grid)" }}
              interval={0}
              tickFormatter={(value: string) => range.tick(value, visible.length <= 12)}
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
              formatter={(value) => [`${value ?? 0} ${unit}`, seriesLabel]}
              labelFormatter={(label) => range.tooltipLabel(String(label))}
            />
            <Bar dataKey="count" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
