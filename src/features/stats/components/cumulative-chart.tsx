"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SegmentedControl } from "@/components/ui/controls";
import { Book } from "@/types/book";
import { CATEGORICAL, SERIES_PRIMARY } from "@/utils/chart-palette";
import { getCumulativeSeries } from "@/utils/stats/book-stats";

/** 每一季只在第一季標出年份，其餘留刻度線就好，不然 X 軸會擠成一團 */
function quarterTick(value: string) {
  return value.endsWith("-Q1") ? value.slice(0, 4) : "";
}

function quarterLabel(label: unknown) {
  const [year, q] = String(label).split("-Q");
  const endMonth = Number(q) * 3;
  return `${year} 年 ${endMonth - 2}–${endMonth} 月`;
}

const SPLITS = [
  { key: "all", label: "總計" },
  { key: "domain", label: "領域" },
  { key: "type", label: "屬性" },
] as const;

type Split = (typeof SPLITS)[number]["key"];

/**
 * 累積完成本數。
 *
 * 跟「每季完成本數」看的是不同的事——那張看節奏起伏，這張看總量一路長上來。
 * 區間永遠是全部：累積曲線切掉前面就不叫累積了。
 *
 * 三種看法堆的是同一份資料：總計那條的高度，等於拆開之後每一層加起來，
 * 所以切換時整體形狀不會變，變的只是「這些量是由什麼組成的」。
 */
export function CumulativeChart({
  books,
  height = 260,
  title = "累積完成本數",
}: {
  books: Book[];
  height?: number | `${number}%`;
  title?: string;
}) {
  const [split, setSplit] = useState<Split>("all");
  const { keys, rows } = getCumulativeSeries(books, split === "all" ? undefined : split);

  if (rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        尚無完成日期資料
      </div>
    );
  }

  const color = (index: number) =>
    keys.length === 1 ? SERIES_PRIMARY : CATEGORICAL[index % CATEGORICAL.length];

  const titleAction = (
    <SegmentedControl size="sm" items={SPLITS} value={split} onChange={setSplit} />
  );

  return (
    <div
      className="rounded-surface flex min-h-0 flex-1 flex-col gap-3.5 border bg-white p-3 md:p-5"
      data-palette="archivum"
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        {title ? <p className="text-sm font-medium">{title}</p> : <span />}
        <SegmentedControl size="sm" items={SPLITS} value={split} onChange={setSplit} />
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cumulativeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_PRIMARY} stopOpacity={0.25} />
                <stop offset="100%" stopColor={SERIES_PRIMARY} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-grid)" strokeDasharray="3 3" />
            <XAxis
              dataKey="quarter"
              tick={{ fill: "var(--color-ink-viz-faint)", fontSize: 12 }}
              axisLine={{ stroke: "var(--color-grid)" }}
              // 負的 tickSize＝刻度往圖裡面畫，軸線才貼著圖
              tickLine={{ stroke: "var(--color-grid)" }}
              tickSize={-5}
              tickMargin={9}
              interval={0}
              tickFormatter={quarterTick}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--color-ink-viz-faint)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface-viz)",
                border: "1px solid var(--color-grid)",
                borderRadius: 6,
                fontSize: 12,
              }}
              formatter={(value, name) => [`${value ?? 0} 本`, String(name)]}
              labelFormatter={quarterLabel}
            />
            {/* 只有一條的時候不畫圖例：那一條的名字已經寫在卡片標題上 */}
            {keys.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
            {keys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="cumulative"
                stroke={color(i)}
                strokeWidth={2}
                fill={keys.length === 1 ? "url(#cumulativeFill)" : color(i)}
                fillOpacity={keys.length === 1 ? 1 : 0.18}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
