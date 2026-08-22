"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { ArticleKpiCards } from "@/features/stats/components/article-kpi-cards";
import { DistributionPie } from "@/features/stats/components/distribution-pie";
import { MonthlyTrendChart } from "@/features/stats/components/monthly-trend-chart";
import { Panel } from "@/features/stats/components/panel";
import { Section, SectionList } from "@/features/stats/components/section-list";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useMounted } from "@/hooks/use-mounted";
import { useWritings } from "@/hooks/use-writings";
import { useSheetStore } from "@/stores/use-sheet-store";
import { getKindDistribution, getWritingKpis, getWritingMonthlyTrend } from "@/utils/writing-stats";

/** 紀事的形狀跟文章一樣，只是單位是「筆」，分布看的是類型與領域 */
export function WritingStats() {
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { writings, isLoading, error } = useWritings();
  const isMobile = useIsMobile();

  if (!mounted) return null;
  if (!sheetId) return <PageMessage>請先到「設定」頁面連接 Google Sheet</PageMessage>;
  if (isLoading) return <PageLoading />;
  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (writings.length === 0) return <PageMessage>還沒有任何紀事</PageMessage>;

  const kpis = getWritingKpis(writings);
  const monthly = getWritingMonthlyTrend(writings);
  // 紀事只有類型一種分類，所以只有一張圖
  const pies = [{ key: "kind", label: "類型分布", data: getKindDistribution(writings) }];

  const trend = (title?: string) => (
    <Panel title={title}>
      <MonthlyTrendChart data={monthly} unit="筆" seriesLabel="筆數" height="100%" />
    </Panel>
  );

  const sections: Section[] = [
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

  return <SectionList sections={sections} />;
}
