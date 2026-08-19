"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { TabBar } from "@/components/ui/controls";
import { CalendarBody } from "@/features/calendar/components/calendar-body";
import { ArticleKpiCards } from "@/features/stats/components/article-kpi-cards";
import { CumulativeChart } from "@/features/stats/components/cumulative-chart";
import { DistributionPie } from "@/features/stats/components/distribution-pie";
import { DistributionTreemap } from "@/features/stats/components/distribution-treemap";
import { KpiCards } from "@/features/stats/components/kpi-cards";
import { MonthlyTrendChart } from "@/features/stats/components/monthly-trend-chart";
import { RankingBar } from "@/features/stats/components/ranking-bar";
import { Section, SectionList } from "@/features/stats/components/section-list";
import { YearlyTrendChart } from "@/features/stats/components/yearly-trend-chart";
import { useArticles } from "@/hooks/useArticles";
import { useBooks } from "@/hooks/useBooks";
import { useEntries } from "@/hooks/useEntries";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useMounted } from "@/hooks/useMounted";
import { useRecords } from "@/hooks/useRecords";
import { useUrlParams } from "@/hooks/useUrlParam";
import { useSheetStore } from "@/store/useSheetStore";
import {
  getArticleDomainDistribution,
  getArticleKpis,
  getArticleMonthlyTrend,
  getArticleTypeDistribution,
  getSourceRanking,
} from "@/utils/articleStats";
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
} from "@/utils/bookStats";
import { getEntryKpis, getEntryMonthlyTrend, getKindDistribution } from "@/utils/entryStats";

type Tab = "books" | "articles" | "entries" | "calendar";

const TABS: { key: Tab; label: string }[] = [
  { key: "books", label: "書籍" },
  { key: "articles", label: "文章" },
  { key: "entries", label: "書寫" },
  // 月曆是統計的一種看法，桌機與手機都放在這裡當分頁
  { key: "calendar", label: "月曆" },
];

/** 圖表卡片：撐滿一頁的高度，圖本身用 100% 跟著縮放 */
function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3.5 rounded-lg border bg-white p-3 md:p-5">
      {title && <p className="shrink-0 text-sm font-medium">{title}</p>}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

function BooksStats() {
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { books, isLoading, error } = useBooks();
  const { quotes } = useRecords();
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

  if (books.length === 0) {
    return <PageMessage>尚未新增任何書籍</PageMessage>;
  }

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

  const sections: Section[] = [
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
              <Panel title="每季完成本數">
                <YearlyTrendChart quarterlyData={quarterly} monthlyData={monthly} height="100%" />
              </Panel>
            ),
          },
          {
            key: "cumulative",
            label: "累積完成本數",
            scrollHeight: "h-70 sm:h-[32rem]",
            node: (
              <Panel title="累積完成本數">
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
                  <YearlyTrendChart quarterlyData={quarterly} monthlyData={monthly} height="100%" />
                </Panel>
              </div>
            ),
          },
          {
            key: "cumulative",
            label: "累積完成本數",
            node: (
              <Panel title="累積完成本數">
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
                title={chart.label}
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
                        title={chart.label}
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
              <DistributionPie title={pie.label} data={pie.data} height="100%" />
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
                    className="flex min-h-0 flex-col rounded-lg border bg-white p-5"
                  >
                    <div className="min-h-0 flex-1">
                      <DistributionPie title={pie.label} data={pie.data} height="100%" />
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
            <div className="rounded-lg border bg-white p-4">
              <RankingBar
                title={r.label}
                data={r.data}
                unit={r.unit}
                showCover={r.key === "reread"}
              />
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
                <div className="rounded-lg border bg-white p-5">
                  <RankingBar
                    title={reread.label}
                    data={reread.data}
                    unit={reread.unit}
                    showCover
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {rankings
                    .filter((r) => r.key !== "reread")
                    .map((r) => (
                      <div key={r.key} className="rounded-lg border bg-white p-5">
                        <RankingBar title={r.label} data={r.data} unit={r.unit} />
                      </div>
                    ))}
                </div>
              </div>
            ),
          },
        ]),
  ];

  return <SectionList sections={sections} />;
}

function ArticlesStats() {
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
              <Panel title="每月完成篇數">
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
        <div className="rounded-lg border bg-white p-5">
          <RankingBar title="來源網站" data={sources} unit="篇" emptyHint="尚無讀完的文章" />
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
              <DistributionPie title={pie.label} data={pie.data} unit="篇" height="100%" />
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
                    <DistributionPie title={pie.label} data={pie.data} unit="篇" height="100%" />
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
function EntriesStats() {
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { entries, isLoading, error } = useEntries();
  const isMobile = useIsMobile();

  if (!mounted) return null;
  if (!sheetId) return <PageMessage>請先到「設定」頁面連接 Google Sheet</PageMessage>;
  if (isLoading) return <PageMessage>載入中…</PageMessage>;
  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (entries.length === 0) return <PageMessage>還沒有任何紀事</PageMessage>;

  const kpis = getEntryKpis(entries);
  const monthly = getEntryMonthlyTrend(entries);
  // 紀事只有類型一種分類，所以只有一張圖
  const pies = [{ key: "kind", label: "類型分布", data: getKindDistribution(entries) }];

  const trend = (
    <Panel title="每月筆數">
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
          { key: "monthly", label: "每月筆數", scrollHeight: "h-70 sm:h-[32rem]", node: trend },
        ]
      : [
          {
            key: "overview",
            label: "概覽",
            node: (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <ArticleKpiCards {...kpis} unit="筆" />
                {trend}
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
              <DistributionPie title={pie.label} data={pie.data} unit="筆" height="100%" />
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
                    <DistributionPie title={pie.label} data={pie.data} unit="筆" height="100%" />
                  </Panel>
                ))}
              </div>
            ),
          },
        ]),
  ];

  return <SectionList sections={sections} />;
}

function StatsTabs() {
  // 檢視哪一邊寫在網址上，重新整理或分享連結都回得到同一個畫面；預設書籍
  const { searchParams, setParams } = useUrlParams();
  const param = searchParams.get("tab");
  const tab: Tab = TABS.some((t) => t.key === param) ? (param as Tab) : "books";
  const setTab = (next: Tab) => setParams({ tab: next === "books" ? null : next });

  return (
    <>
      <PageHeader title="統計" action={<TabBar items={TABS} value={tab} onChange={setTab} />} />
      <PageBody>
        {tab === "calendar" ? (
          <CalendarBody />
        ) : tab === "books" ? (
          <BooksStats />
        ) : tab === "entries" ? (
          <EntriesStats />
        ) : (
          <ArticlesStats />
        )}
      </PageBody>
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function StatsPage() {
  return (
    <Suspense fallback={null}>
      <StatsTabs />
    </Suspense>
  );
}
