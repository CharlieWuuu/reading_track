"use client";

import { useMemo } from "react";
import { CumulativeChart } from "@/features/stats/components/cumulative-chart";
import { DistributionPie } from "@/features/stats/components/distribution-pie";
import { DistributionTreemap } from "@/features/stats/components/distribution-treemap";
import { MonthlyTrendChart } from "@/features/stats/components/monthly-trend-chart";
import { Panel } from "@/features/stats/components/panel";
import { RankingBar } from "@/features/stats/components/ranking-bar";
import { Section } from "@/features/stats/components/section-list";
import { wideSections, type WideSlots } from "@/features/stats/components/wide-stat-sections";
import { YearlyTrendChart } from "@/features/stats/components/yearly-trend-chart";
import { statsOfModules } from "@/utils/stats/from-modules";
import {
  distribution,
  quarterly,
  repeats,
  statData,
  withLinks,
  type StatRow,
} from "@/utils/stats/generic-stats";
import { getRecordKpis, getRecordMonthlyTrend } from "@/utils/stats/record-stats";
import type { DistributionGroup, DistributionSlice } from "@/utils/stats/types";

/**
 * 一個類型勾了哪些模組，統計頁就有哪幾張圖。
 *
 * 取代 use-book/article/writing-sections 那三份——它們的差別其實只有
 * 「看哪幾個欄位、單位叫什麼」，那兩件事現在都從模組庫讀得到。
 * 開「影集」勾了導演與片長，不用寫程式就有常看導演與總時數。
 *
 * 一張圖一塊，並排與否交給 SectionList——這裡只管「有哪幾張圖、各畫什麼」。
 */
export function useModuleSections({
  moduleKeys,
  labels,
  rows,
  unit,
  groupBy,
  showRepeats,
  showLinks,
  wide,
  onSelect,
}: {
  moduleKeys: readonly string[];
  /** 這個類型替模組取的名字（書籍把 creator 叫「作者」） */
  labels?: Readonly<Record<string, string>>;
  rows: StatRow[];
  /** 「本」「篇」「筆」——類型自己的量詞 */
  unit: string;
  /**
   * 額外拿某一欄再分一張圖。給的是欄位名與標題。
   *
   * 「類型分布」推不出來：kind 不是模組，是那一筆屬於哪一種——
   * 一次看好幾種書寫（心得、思緒、札記）時，這張圖才說得出比例。
   */
  groupBy?: { field: string; label: string };
  /**
   * 列表帶得出「同一個作品有幾筆紀錄」時打開，出重讀排行。
   * 全部都只做過一次會自動不顯示——文章與影集現在就是那樣。
   */
  showRepeats?: boolean;
  /** 列表帶了 linkCount 時打開，概覽多一張「有延伸」的數字卡 */
  showLinks?: boolean;
  /** 月曆與數線由呼叫端給——那兩支住在 features/calendar，這裡 import 不到 */
  wide?: WideSlots;
  /** 地圖或數線上點一筆要去哪。沒給就不做成可點的 */
  onSelect?: (name: string) => void;
}): Section[] {
  return useMemo(() => {
    const data = statData(statsOfModules(moduleKeys, labels), rows);

    const trend = data.find((d) => d.kind === "trend");
    const kpis = getRecordKpis(
      rows.map((row) => ({ date: row[trend?.field ?? "endDate"] ?? null })),
    );
    const monthly = trend
      ? getRecordMonthlyTrend(rows.map((row) => ({ date: row[trend.field] ?? null })))
      : [];

    const sums = data.filter((d) => d.kind === "sum");
    const repeatRows = showRepeats ? repeats(rows) : [];
    const quarters = quarterly(rows, trend?.field ?? "endDate");
    const rankings: PieItem[] = [
      ...data.flatMap<PieItem>((d) =>
        d.kind === "ranking"
          ? [{ key: d.spec.moduleKey, label: d.spec.label, slices: d.slices }]
          : [],
      ),
      // 重讀放最後：它問的是「哪幾本值得再讀一次」，跟其他排行不是同一種問題
      ...(showRepeats && repeatRows.length
        ? [{ key: "repeats", label: "重複最多", slices: repeatRows }]
        : []),
    ];
    // 能拆的維度就是那幾張分布圖看的欄位：領域、屬性、語言、平台
    const cumulativeSplits = data.flatMap((d) =>
      d.kind === "tree" || d.kind === "distribution"
        ? [{ key: d.spec.fields[0], label: d.spec.label }]
        : [],
    );
    const pies: PieItem[] = [
      ...(groupBy
        ? [
            {
              key: groupBy.field,
              label: groupBy.label,
              slices: distribution(rows, groupBy.field),
            },
          ]
        : []),
      ...data.flatMap<PieItem>((d) => {
        if (d.kind === "distribution")
          return [{ key: d.spec.moduleKey, label: d.spec.label, slices: d.slices }];
        if (d.kind === "tree")
          return [{ key: d.spec.moduleKey, label: d.spec.label, groups: d.groups }];
        return [];
      }),
    ];

    // 跨了兩年以上才用季當刻度：只看半年的話，兩根季長條看不出這半年發生什麼事
    const trendChart = () =>
      quarters.length > 8 ? (
        <YearlyTrendChart
          title={`每季${unit}數`}
          quarterlyData={quarters}
          monthlyData={monthly}
          height="100%"
        />
      ) : (
        <MonthlyTrendChart
          title={`每月${unit}數`}
          data={monthly}
          unit={unit}
          seriesLabel={`${unit}數`}
          height="100%"
        />
      );

    // 累積曲線只在有足夠季數時才有意義——兩三格看不出「一路長上來」
    const cumulativeSection =
      quarters.length > 4
        ? [
            {
              key: "cumulative",
              label: `累積${unit}數`,
              node: (
                <CumulativeChart
                  title={`累積${unit}數`}
                  rows={rows}
                  splits={cumulativeSplits}
                  height="100%"
                />
              ),
            },
          ]
        : [];

    const summary = (
      <div className="flex flex-wrap gap-3">
        <Kpi label={`累計${unit}數`} value={kpis.completed} />
        <Kpi label="今年" value={kpis.thisYear} />
        <Kpi label="每月平均" value={kpis.avgPerMonth} />
        {showLinks && <Kpi label="有延伸" value={withLinks(rows)} />}
        {sums.map((s) => (
          <Kpi key={s.spec.moduleKey} label={`總${s.spec.label}`} value={s.total} />
        ))}
      </div>
    );

    const pieNode = (item: PieItem) =>
      item.groups ? (
        <DistributionTreemap groups={item.groups} unit={unit} />
      ) : (
        <DistributionPie data={item.slices ?? []} unit={unit} height="100%" />
      );

    return [
      // 數字卡橫著擺、自己會換行：不需要外面給高度，但要整排寬
      { key: "overview", label: "概覽", needsHeight: false, fullWidth: true, node: summary },
      // label 跟著圖走：跨兩年以上畫的是每季，叫「每月」會對不上圖上的標題
      ...(trend
        ? [
            {
              key: "trend",
              label: `${quarters.length > 8 ? "每季" : "每月"}${unit}數`,
              node: trendChart(),
            },
          ]
        : []),
      ...cumulativeSection,

      // 一張圖一塊，並排交給 SectionList 的 grid——這裡不管版面
      ...pies.map((item) => ({
        key: item.key,
        label: item.label,
        node: <Panel title={item.label}>{pieNode(item)}</Panel>,
      })),

      // 跟圖表一樣吃高度：兩欄並排時隔壁是圓餅，高度隨內容會差一大截
      ...rankings.map((item) => ({
        key: item.key,
        label: `${item.label} Top 5`,
        node: (
          <Panel title={`${item.label} Top 5`}>
            <RankingBar data={item.slices ?? []} unit={unit} />
          </Panel>
        ),
      })),

      // 月曆、數線、地圖、年代排最後：各自佔一整排，夾在小圖中間會把版面切碎
      ...wideSections({ data, rows, slots: wide ?? {}, onSelect }),
    ];
  }, [moduleKeys, labels, rows, unit, groupBy, showRepeats, showLinks, wide, onSelect]);
}

/** 圓餅那一區的一格：一層用 slices，兩層（領域）用 groups */
type PieItem = {
  key: string;
  label: string;
  slices?: DistributionSlice[];
  groups?: DistributionGroup[];
};

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-surface flex-1 border bg-white px-4 py-3">
      <p className="text-meta text-ink-muted">{label}</p>
      <p className="text-xl font-medium">{value.toLocaleString("zh-Hant")}</p>
    </div>
  );
}
