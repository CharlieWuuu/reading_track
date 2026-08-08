"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { ArticleKpiCards } from "@/components/stats/ArticleKpiCards";
import { CumulativeChart } from "@/components/stats/CumulativeChart";
import { DistributionPie } from "@/components/stats/DistributionPie";
import { DistributionTreemap } from "@/components/stats/DistributionTreemap";
import { KpiCards } from "@/components/stats/KpiCards";
import { MonthlyTrendChart } from "@/components/stats/MonthlyTrendChart";
import { RankingBar } from "@/components/stats/RankingBar";
import { Section, SectionList } from "@/components/stats/SectionList";
import { YearlyTrendChart } from "@/components/stats/YearlyTrendChart";
import {
  getArticleKpis,
  getArticleMonthlyTrend,
  getCompletionDistribution,
  getSourceRanking,
  getTagDistribution,
} from "@/lib/articleStats";
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
} from "@/lib/bookStats";
import { useArticles } from "@/lib/useArticles";
import { useBooks } from "@/lib/useBooks";
import { useIsMobile } from "@/lib/useIsMobile";
import { useMounted } from "@/lib/useMounted";
import { useRecords } from "@/lib/useRecords";
import { useUrlParams } from "@/lib/useUrlParam";
import { useInstapaperStore } from "@/store/useInstapaperStore";
import { useSheetStore } from "@/store/useSheetStore";

const TABS = [
  { key: "books", label: "書籍" },
  { key: "articles", label: "文章" },
] as const;

type Tab = (typeof TABS)[number]["key"];

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1.5 text-sm font-medium ${
        active ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

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
    { key: "domain", label: "領域分布", groups: getDomainGroups(books), data: undefined },
    { key: "type", label: "屬性分布", data: getTypeDistribution(books), groups: undefined },
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
    // 樹狀圖一頁一張：格子上的字要看得清楚，兩張並排會擠到讀不出來
    ...treemaps.map((chart) => ({
      key: chart.key,
      label: chart.label,
      scrollHeight: "h-80 sm:h-[32rem]",
      node: (
        <Panel>
          <DistributionTreemap title={chart.label} data={chart.data} groups={chart.groups} />
        </Panel>
      ),
    })),
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
  const { token } = useInstapaperStore();
  const mounted = useMounted();
  const { articles, isLoading, error } = useArticles();
  const isMobile = useIsMobile();

  if (!mounted) return null;

  if (!token) {
    return <PageMessage>請先到「設定」頁面連接 Instapaper</PageMessage>;
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
    { key: "completion", label: "已完成／未完成", data: getCompletionDistribution(articles) },
    { key: "tag", label: "屬性分布", data: getTagDistribution(articles) },
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
      label: "來源網站",
      needsHeight: false,
      node: (
        <div className="rounded-lg border bg-white p-5">
          <RankingBar
            title="來源網站（深色＝已完成）"
            data={sources}
            unit="篇"
            emptyHint="尚無文章"
          />
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
                  <div
                    key={pie.key}
                    className="flex min-h-0 flex-col rounded-lg border bg-white p-5"
                  >
                    <div className="min-h-0 flex-1">
                      <DistributionPie title={pie.label} data={pie.data} unit="篇" height="100%" />
                    </div>
                  </div>
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
  const tab: Tab = param === "articles" ? "articles" : "books";
  const setTab = (next: Tab) => setParams({ tab: next === "books" ? null : next });

  return (
    <>
      <PageHeader
        title="統計"
        action={
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {TABS.map((t) => (
              <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </TabButton>
            ))}
          </div>
        }
      />
      {tab === "books" ? <BooksStats /> : <ArticlesStats />}
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
