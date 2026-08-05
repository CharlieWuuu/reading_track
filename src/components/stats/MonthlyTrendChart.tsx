"use client";

import { RangedBarChart, RangeOption } from "@/components/stats/RangedBarChart";
import { MonthCount } from "@/lib/bookStats";

/** 資料一個月一根，區間長度用月來數 */
const RANGES: RangeOption[] = [
  { key: "all", label: "全部", size: 0 },
  { key: "2y", label: "兩年", size: 24 },
  { key: "1y", label: "一年", size: 12 },
  { key: "6m", label: "六個月", size: 6 },
];

/** 根數多的時候只標一月（＝年份的起點），範圍小就每根都標月份 */
function tick(value: string, dense: boolean) {
  const [year, month] = value.split("-");
  if (dense) return `${Number(month)}月`;
  return month === "01" ? year : "";
}

function tooltipLabel(value: string) {
  const [year, month] = value.split("-");
  return `${year} 年 ${Number(month)} 月`;
}

/** 每月完成數。區間邏輯與每季完成本數一致 */
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
    <RangedBarChart
      data={data.map((d) => ({ key: d.month, count: d.count }))}
      ranges={RANGES}
      tick={tick}
      tooltipLabel={tooltipLabel}
      unit={unit}
      seriesLabel={seriesLabel}
      height={height}
    />
  );
}
