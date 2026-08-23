"use client";

import { useMemo } from "react";
import { CumulativeChart } from "@/features/stats/components/cumulative-chart";
import { DistributionPie } from "@/features/stats/components/distribution-pie";
import { DistributionTreemap } from "@/features/stats/components/distribution-treemap";
import { KpiCards } from "@/features/stats/components/kpi-cards";
import { Panel } from "@/features/stats/components/panel";
import { RankingBar } from "@/features/stats/components/ranking-bar";
import { Section } from "@/features/stats/components/section-list";
import { YearlyTrendChart } from "@/features/stats/components/yearly-trend-chart";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Book } from "@/types/book";
import { QuoteRow } from "@/types/record";
import {
  getAuthorRanking,
  getDomainGroups,
  getKpis,
  getLanguageDistribution,
  getMonthlyTrend,
  getPlatformDistribution,
  getPublisherRanking,
  getQuarterlyTrend,
  getRereadRanking,
  getTypeDistribution,
} from "@/utils/book-stats";

/**
 * 書籍統計要畫哪幾塊。
 *
 * 抽出來是因為原本 265 行裡有兩百行都在組這個陣列，元件本身只是「擋掉沒資料的
 * 情況，然後把陣列交給 SectionList」。手機與桌機的分支也在這裡：同一份資料，
 * 窄螢幕一頁一張、寬螢幕並排，那是版面決定不是資料決定。
 */
export function useBookSections(books: Book[], quotes: QuoteRow[]): Section[] {
  const isMobile = useIsMobile();

  return useMemo(() => {
    const kpis = getKpis(books, quotes);
    const quarterly = getQuarterlyTrend(books);
    // 一年／六個月的區間用月當刻度，所以月的資料也要備著
    const monthly = getMonthlyTrend(books);

    const reread = {
      key: "reread",
      label: "重讀最多 Top 5",
      data: getRereadRanking(books),
      unit: "次",
    };
    const rankings = [
      reread,
      { key: "author", label: "常讀作者 Top 5", data: getAuthorRanking(books), unit: "本" },
      { key: "publisher", label: "常讀出版社 Top 5", data: getPublisherRanking(books), unit: "本" },
    ];

    /**
     * 領域與屬性的類別多到二十幾個，圓餅畫不下：小的那些會變成分不出來的細線，
     * 顏色也不夠分。改用樹狀圖——面積就是量，類別再多都塞得進一個畫面。
     * 語言與平台只有幾個類別，而且問的本來就是比例，維持圓餅。
     */
    const treemaps = [
      {
        key: "domain",
        label: "領域分布",
        groups: getDomainGroups(books),
        data: undefined,
        colorful: false,
      },
      {
        key: "type",
        label: "屬性分布",
        data: getTypeDistribution(books),
        groups: undefined,
        colorful: true,
      },
    ];

    const pies = [
      { key: "language", label: "語言分布", data: getLanguageDistribution(books) },
      { key: "platform", label: "平台分布", data: getPlatformDistribution(books) },
    ];

    return [
      // 手機把數字與歷年圖表拆成兩頁：擠在同一頁的話，五張數字卡先吃掉高度，
      // 剩給圖表的不到 100px，長條會被壓成一條線
      ...(isMobile
        ? [
            {
              key: "overview",
              label: "概覽",
              needsHeight: false,
              node: <KpiCards {...kpis} />,
            },
            {
              key: "yearly",
              label: "每季完成本數",
              scrollHeight: "h-70 sm:h-[32rem]",
              node: (
                <Panel>
                  <YearlyTrendChart quarterlyData={quarterly} monthlyData={monthly} height="100%" />
                </Panel>
              ),
            },
            {
              key: "cumulative",
              label: "累積完成本數",
              scrollHeight: "h-70 sm:h-[32rem]",
              node: (
                <Panel>
                  <CumulativeChart quarterlyData={quarterly} height="100%" />
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
                  <KpiCards {...kpis} />
                  <Panel title="每季完成本數">
                    <YearlyTrendChart
                      quarterlyData={quarterly}
                      monthlyData={monthly}
                      height="100%"
                    />
                  </Panel>
                </div>
              ),
            },
            {
              key: "cumulative",
              label: "累積完成本數",
              node: (
                <Panel>
                  <CumulativeChart quarterlyData={quarterly} height="100%" />
                </Panel>
              ),
            },
          ]),
      // 樹狀圖：窄的時候一張一頁（格子上的字擠在一起會讀不出來），
      // 寬到放得下兩張還能看清楚字，才並排
      ...(isMobile
        ? treemaps.map((chart) => ({
            key: chart.key,
            label: chart.label,
            scrollHeight: "h-80 sm:h-[32rem]",
            node: (
              <Panel>
                <DistributionTreemap
                  data={chart.data}
                  groups={chart.groups}
                  colorful={chart.colorful}
                />
              </Panel>
            ),
          }))
        : [
            {
              key: "treemaps",
              label: "分布",
              needsHeight: false,
              node: (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {treemaps.map((chart) => (
                    <div key={chart.key} className="flex h-104 flex-col xl:h-128">
                      <Panel>
                        <DistributionTreemap
                          data={chart.data}
                          groups={chart.groups}
                          colorful={chart.colorful}
                        />
                      </Panel>
                    </div>
                  ))}
                </div>
              ),
            },
          ]),
      // 手機一頁放一個圓餅圖才看得清楚，桌機兩張一次排完
      ...(isMobile
        ? pies.map((pie) => ({
            key: pie.key,
            label: pie.label,
            // 圓餅本來就是圓的，容器做成正方形剛好貼合，不會上下留白
            scrollHeight: "aspect-square",
            node: (
              <Panel>
                <DistributionPie data={pie.data} height="100%" />
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
                    <div
                      key={pie.key}
                      className="rounded-surface flex min-h-0 flex-col border bg-white p-5"
                    >
                      <div className="min-h-0 flex-1">
                        <DistributionPie data={pie.data} height="100%" />
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
          ]),
      // 排行：手機一頁一張，桌機兩張並排
      ...(isMobile
        ? rankings.map((r) => ({
            key: r.key,
            label: r.label,
            needsHeight: false,
            node: (
              <div className="rounded-surface border bg-white p-4">
                <RankingBar data={r.data} unit={r.unit} showCover={r.key === "reread"} />
              </div>
            ),
          }))
        : [
            {
              key: "ranking",
              label: "排行",
              needsHeight: false,
              // 重讀排行帶書封，自己占一整列；作者與出版社排在下面兩欄
              node: (
                <div className="flex flex-col gap-4">
                  <div className="rounded-surface border bg-white p-5">
                    <RankingBar data={reread.data} unit={reread.unit} showCover />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {rankings
                      .filter((r) => r.key !== "reread")
                      .map((r) => (
                        <div key={r.key} className="rounded-surface border bg-white p-5">
                          <RankingBar data={r.data} unit={r.unit} />
                        </div>
                      ))}
                  </div>
                </div>
              ),
            },
          ]),
    ];
  }, [books, quotes, isMobile]);
}
