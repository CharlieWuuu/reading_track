"use client";

import { RangedBarChart, RangeOption } from "@/components/stats/RangedBarChart";
import { QuarterCount } from "@/lib/bookStats";

/** 資料一季一根，所以區間長度也用季來數 */
const RANGES: RangeOption[] = [
  { key: "all", label: "全部", size: 0 },
  { key: "2y", label: "兩年", size: 8 },
  { key: "1y", label: "一年", size: 4 },
  { key: "6m", label: "六個月", size: 2 },
];

/** 季數多的時候只在第一季標年份，不然 X 軸會擠成一團；範圍小就每根都標得下 */
function tick(value: string, dense: boolean) {
  if (!dense) return value.endsWith("-Q1") ? value.slice(0, 4) : "";
  const [year, q] = value.split("-Q");
  return `${year.slice(2)}Q${q}`;
}

function tooltipLabel(value: string) {
  const [year, q] = value.split("-Q");
  const endMonth = Number(q) * 3;
  return `${year} 年 ${endMonth - 2}–${endMonth} 月`;
}

/** 每季完成本數 */
export function YearlyTrendChart({
  quarterlyData,
  height = 260,
}: {
  quarterlyData: QuarterCount[];
  height?: number | `${number}%`;
}) {
  return (
    <RangedBarChart
      data={quarterlyData.map((d) => ({ key: d.quarter, count: d.count }))}
      ranges={RANGES}
      tick={tick}
      tooltipLabel={tooltipLabel}
      unit="本"
      seriesLabel="完成本數"
      emptyText="尚無完成日期資料"
      height={height}
    />
  );
}
