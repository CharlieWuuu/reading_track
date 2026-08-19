"use client";

import { RangedBarChart, RangeOption } from "@/features/stats/components/ranged-bar-chart";
import { MonthCount, QuarterCount } from "@/utils/bookStats";

/** 季數多的時候只在第一季標年份，不然 X 軸會擠成一團；範圍小就每根都標得下 */
function quarterTick(value: string, dense: boolean) {
  if (!dense) return value.endsWith("-Q1") ? value.slice(0, 4) : "";
  const [year, q] = value.split("-Q");
  return `${year.slice(2)}Q${q}`;
}

function quarterLabel(value: string) {
  const [year, q] = value.split("-Q");
  const endMonth = Number(q) * 3;
  return `${year} 年 ${endMonth - 2}–${endMonth} 月`;
}

function monthTick(value: string) {
  const [, month] = value.split("-");
  return `${Number(month)}月`;
}

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  return `${year} 年 ${Number(month)} 月`;
}

/**
 * 完成本數的趨勢。
 *
 * 兩年以上用季當刻度，一年與六個月改用月——只看半年的話，
 * 兩根季長條看不出這半年到底發生什麼事。
 */
export function YearlyTrendChart({
  quarterlyData,
  monthlyData,
  height = 260,
}: {
  quarterlyData: QuarterCount[];
  monthlyData: MonthCount[];
  height?: number | `${number}%`;
}) {
  const quarters = quarterlyData.map((d) => ({ key: d.quarter, count: d.count }));
  const months = monthlyData.map((d) => ({ key: d.month, count: d.count }));

  const ranges: RangeOption[] = [
    {
      key: "all",
      label: "全部",
      size: 0,
      data: quarters,
      tick: quarterTick,
      tooltipLabel: quarterLabel,
    },
    {
      key: "2y",
      label: "兩年",
      size: 8,
      data: quarters,
      tick: quarterTick,
      tooltipLabel: quarterLabel,
    },
    { key: "1y", label: "一年", size: 12, data: months, tick: monthTick, tooltipLabel: monthLabel },
    {
      key: "6m",
      label: "六個月",
      size: 6,
      data: months,
      tick: monthTick,
      tooltipLabel: monthLabel,
    },
  ];

  return (
    <RangedBarChart
      ranges={ranges}
      unit="本"
      seriesLabel="完成本數"
      emptyText="尚無完成日期資料"
      height={height}
    />
  );
}
