"use client";

import { useMemo } from "react";
import { ArticleKpiCards } from "@/features/stats/components/article-kpi-cards";
import { DistributionPie } from "@/features/stats/components/distribution-pie";
import { MonthlyTrendChart } from "@/features/stats/components/monthly-trend-chart";
import { Panel } from "@/features/stats/components/panel";
import { Section } from "@/features/stats/components/section-list";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Writing } from "@/types/writing";
import {
  getKindDistribution,
  getWritingKpis,
  getWritingMonthlyTrend,
} from "@/utils/stats/writing-stats";

/**
 * 紀事統計要畫哪幾塊。紀事只有類型一種分類，所以比書籍與文章少一組圖。
 */
export function useWritingSections(writings: Writing[]): Section[] {
  const isMobile = useIsMobile();

  return useMemo(() => {
    const kpis = getWritingKpis(writings);
    const monthly = getWritingMonthlyTrend(writings);
    // 紀事只有類型一種分類，所以只有一張圖
    const pies = [{ key: "kind", label: "類型分布", data: getKindDistribution(writings) }];

    const trend = (title?: string) => (
      <Panel title={title}>
        <MonthlyTrendChart data={monthly} unit="筆" seriesLabel="筆數" height="100%" />
      </Panel>
    );

    return [
      // 手機把數字與趨勢圖拆成兩頁，理由同書籍：擠在一起圖表會被壓扁
      ...(isMobile
        ? [
            {
              key: "overview",
              label: "概覽",
              needsHeight: false,
              node: <ArticleKpiCards {...kpis} unit="筆" />,
            },
            { key: "monthly", label: "每月筆數", scrollHeight: "h-70 sm:h-[32rem]", node: trend() },
          ]
        : [
            {
              key: "overview",
              label: "概覽",
              node: (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <ArticleKpiCards {...kpis} unit="筆" />
                  {trend("每月筆數")}
                </div>
              ),
            },
          ]),
      ...(isMobile
        ? pies.map((pie) => ({
            key: pie.key,
            label: pie.label,
            scrollHeight: "aspect-square",
            node: (
              <Panel>
                <DistributionPie data={pie.data} unit="筆" height="100%" />
              </Panel>
            ),
          }))
        : [
            {
              key: "distribution",
              label: "分布",
              node: (
                <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
                  {pies.map((pie) => (
                    <Panel key={pie.key}>
                      <DistributionPie data={pie.data} unit="筆" height="100%" />
                    </Panel>
                  ))}
                </div>
              ),
            },
          ]),
    ];
  }, [writings, isMobile]);
}
