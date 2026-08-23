"use client";

import { RangedBarChart, RangeOption } from "@/features/stats/components/ranged-bar-chart";
import { MonthCount } from "@/utils/stats/book-stats";

/** 根數多的時候只標一月（＝年份的起點），範圍小就每根都標月份 */
function monthTick(value: string, dense: boolean) {
  const [year, month] = value.split("-");
  if (dense) return `${Number(month)}月`;
  return month === "01" ? year : "";
}

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  return `${year} 年 ${Number(month)} 月`;
}

/** 每月完成數。區間邏輯與書籍一致，只是資料本來就只有月，不再換刻度 */
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
  const months = data.map((d) => ({ key: d.month, count: d.count }));
  const ranges: RangeOption[] = [
    { key: "all", label: "全部", size: 0 },
    { key: "2y", label: "兩年", size: 24 },
    { key: "1y", label: "一年", size: 12 },
    { key: "6m", label: "六個月", size: 6 },
  ].map((r) => ({ ...r, data: months, tick: monthTick, tooltipLabel: monthLabel }));

  return <RangedBarChart ranges={ranges} unit={unit} seriesLabel={seriesLabel} height={height} />;
}
