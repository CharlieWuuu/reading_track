"use client";

import { useMemo } from "react";
import { ArticleKpiCards } from "@/features/stats/components/article-kpi-cards";
import { DistributionPie } from "@/features/stats/components/distribution-pie";
import { MonthlyTrendChart } from "@/features/stats/components/monthly-trend-chart";
import { Panel } from "@/features/stats/components/panel";
import { RankingBar } from "@/features/stats/components/ranking-bar";
import { Section } from "@/features/stats/components/section-list";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Article } from "@/types/article";
import {
  getArticleDomainDistribution,
  getArticleKpis,
  getArticleMonthlyTrend,
  getArticleTypeDistribution,
  getSourceRanking,
} from "@/utils/article-stats";

/**
 * 文章統計要畫哪幾塊。結構與 useBookSections 相同：資料算完組成陣列，
 * 手機與桌機的差別是版面決定不是資料決定。
 */
export function useArticleSections(articles: Article[]): Section[] {
  const isMobile = useIsMobile();

  return useMemo(() => {
    const kpis = getArticleKpis(articles);
    const monthly = getArticleMonthlyTrend(articles);
    const sources = getSourceRanking(articles);

    const pies = [
      { key: "domain", label: "領域分布", data: getArticleDomainDistribution(articles) },
      { key: "type", label: "屬性分布", data: getArticleTypeDistribution(articles) },
    ];

    return [
      // 手機把數字與趨勢圖拆成兩頁，理由同書籍：擠在一起圖表會被壓扁
      ...(isMobile
        ? [
            {
              key: "overview",
              label: "概覽",
              needsHeight: false,
              node: <ArticleKpiCards {...kpis} />,
            },
            {
              key: "monthly",
              label: "每月完成篇數",
              scrollHeight: "h-70 sm:h-[32rem]",
              node: (
                <Panel>
                  <MonthlyTrendChart
                    data={monthly}
                    unit="篇"
                    seriesLabel="完成篇數"
                    height="100%"
                  />
                </Panel>
              ),
            },
          ]
        : [
            {
              key: "overview",
              label: "概覽",
              node: (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <ArticleKpiCards {...kpis} />
                  <Panel title="每月完成篇數">
                    <MonthlyTrendChart
                      data={monthly}
                      unit="篇"
                      seriesLabel="完成篇數"
                      height="100%"
                    />
                  </Panel>
                </div>
              ),
            },
          ]),
      {
        key: "source",
        label: "來源站台",
        needsHeight: false,
        node: (
          <div className="rounded-surface border bg-white p-5">
            <RankingBar data={sources} unit="篇" emptyHint="尚無讀完的文章" />
          </div>
        ),
      },
      ...(isMobile
        ? pies.map((pie) => ({
            key: pie.key,
            label: pie.label,
            // 圓餅本來就是圓的，容器做成正方形剛好貼合，不會上下留白
            scrollHeight: "aspect-square",
            node: (
              <Panel>
                <DistributionPie data={pie.data} unit="篇" height="100%" />
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
                      <DistributionPie data={pie.data} unit="篇" height="100%" />
                    </Panel>
                  ))}
                </div>
              ),
            },
          ]),
    ];
  }, [articles, isMobile]);
}
