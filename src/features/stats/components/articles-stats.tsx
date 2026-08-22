"use client";

import { PageMessage } from "@/components/layout/page-message";
import { ArticleKpiCards } from "@/features/stats/components/article-kpi-cards";
import { DistributionPie } from "@/features/stats/components/distribution-pie";
import { MonthlyTrendChart } from "@/features/stats/components/monthly-trend-chart";
import { Panel } from "@/features/stats/components/panel";
import { RankingBar } from "@/features/stats/components/ranking-bar";
import { Section, SectionList } from "@/features/stats/components/section-list";
import { useArticles } from "@/hooks/use-articles";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useMounted } from "@/hooks/use-mounted";
import { useSheetStore } from "@/stores/use-sheet-store";
import {
  getArticleDomainDistribution,
  getArticleKpis,
  getArticleMonthlyTrend,
  getArticleTypeDistribution,
  getSourceRanking,
} from "@/utils/article-stats";

export function ArticlesStats() {
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { articles, isLoading, error } = useArticles();
  const isMobile = useIsMobile();

  if (!mounted) return null;

  if (!sheetId) {
    return <PageMessage>請先到「設定」頁面連接 Google Sheet</PageMessage>;
  }

  if (isLoading) {
    return <PageMessage>載入中…</PageMessage>;
  }

  if (error) {
    return <PageMessage tone="error">{error}</PageMessage>;
  }

  if (articles.length === 0) {
    return <PageMessage>尚無文章</PageMessage>;
  }

  const kpis = getArticleKpis(articles);
  const monthly = getArticleMonthlyTrend(articles);
  const sources = getSourceRanking(articles);

  const pies = [
    { key: "domain", label: "領域分布", data: getArticleDomainDistribution(articles) },
    { key: "type", label: "屬性分布", data: getArticleTypeDistribution(articles) },
  ];

  const sections: Section[] = [
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
                <MonthlyTrendChart data={monthly} unit="篇" seriesLabel="完成篇數" height="100%" />
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
        <div className="rounded-surface bg-white p-5">
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

  return <SectionList sections={sections} />;
}

/** 紀事的形狀跟文章一樣，只是單位是「筆」，分布看的是類型與領域 */
