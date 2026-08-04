"use client";

import { useState } from "react";
import { SectionPager, Section } from "@/components/stats/SectionPager";
import { useIsMobile } from "@/lib/useIsMobile";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";
import { useInstapaperStore } from "@/store/useInstapaperStore";
import { useArticles } from "@/lib/useArticles";
import { KpiCards } from "@/components/stats/KpiCards";
import { YearlyTrendChart } from "@/components/stats/YearlyTrendChart";
import { MonthlyTrendChart } from "@/components/stats/MonthlyTrendChart";
import { DistributionPie } from "@/components/stats/DistributionPie";
import { ArticleKpiCards } from "@/components/stats/ArticleKpiCards";
import { FolderTrendChart } from "@/components/stats/FolderTrendChart";
import {
  getDomainDistribution,
  getKpis,
  getLanguageDistribution,
  getMonthlyTrend,
  getPlatformDistribution,
  getQuarterlyTrend,
  getTypeDistribution,
} from "@/lib/bookStats";
import {
  getArticleKpis,
  getArticleMonthlyTrend,
  getCompletionDistribution,
  getFolderDistribution,
  getFolderMonthlyTrend,
  getSourceDistribution,
} from "@/lib/articleStats";

type Tab = "books" | "articles";

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
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border bg-white p-3 md:p-5">
      {title && <p className="mb-2 shrink-0 text-sm font-medium">{title}</p>}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

function BooksStats() {
  const { sheetId } = useSheetStore();
  const { books, isLoading, error } = useBooks();
  const isMobile = useIsMobile();

  if (!sheetId) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        請先到「設定」頁面連接 Google Sheet
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        載入中…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        尚未新增任何書籍
      </div>
    );
  }

  const kpis = getKpis(books);
  const quarterly = getQuarterlyTrend(books);
  const monthly = getMonthlyTrend(books);

  const pies = [
    { key: "domain", label: "領域分布", data: getDomainDistribution(books) },
    { key: "type", label: "屬性分布", data: getTypeDistribution(books) },
    { key: "language", label: "語言分布", data: getLanguageDistribution(books) },
    { key: "platform", label: "平台分布", data: getPlatformDistribution(books) },
  ];

  const sections: Section[] = [
    {
      key: "overview",
      label: "概覽",
      node: (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <KpiCards {...kpis} />
          <Panel title="歷年完成本數">
            <YearlyTrendChart quarterlyData={quarterly} height="100%" />
          </Panel>
        </div>
      ),
    },
    {
      key: "monthly",
      label: "月趨勢",
      node: (
        <Panel title="近 24 個月完成趨勢">
          <MonthlyTrendChart data={monthly} height="100%" />
        </Panel>
      ),
    },
    // 手機一頁放一個圓餅圖才看得清楚，桌機四張一次排完
    ...(isMobile
      ? pies.map((pie) => ({
          key: pie.key,
          label: pie.label,
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
                  <div key={pie.key} className="flex min-h-0 flex-col rounded-lg border bg-white p-5">
                    <div className="min-h-0 flex-1">
                      <DistributionPie title={pie.label} data={pie.data} height="100%" />
                    </div>
                  </div>
                ))}
              </div>
            ),
          },
        ]),
  ];

  return <SectionPager sections={sections} />;
}

function ArticlesStats() {
  const { token } = useInstapaperStore();
  const { articles, isLoading, error } = useArticles();
  const isMobile = useIsMobile();

  if (!token) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        請先到「設定」頁面連接 Instapaper
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        載入中…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        尚無文章
      </div>
    );
  }

  const kpis = getArticleKpis(articles);
  const monthly = getArticleMonthlyTrend(articles);
  const folderTrend = getFolderMonthlyTrend(articles);

  const pies = [
    { key: "completion", label: "已完成／未完成", data: getCompletionDistribution(articles) },
    { key: "folder", label: "資料夾分布", data: getFolderDistribution(articles) },
    { key: "source", label: "來源網站分布（已完成）", data: getSourceDistribution(articles) },
  ];

  const sections: Section[] = [
    {
      key: "overview",
      label: "概覽",
      node: (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <ArticleKpiCards {...kpis} />
          <Panel title="近 24 個月完成趨勢">
            <MonthlyTrendChart data={monthly} unit="篇" seriesLabel="完成篇數" height="100%" />
          </Panel>
        </div>
      ),
    },
    {
      key: "folders",
      label: "資料夾趨勢",
      node: (
        <Panel title="資料夾趨勢（實線＝已完成、虛線＝未完成）">
          <FolderTrendChart data={folderTrend.data} series={folderTrend.series} height="100%" />
        </Panel>
      ),
    },
    ...(isMobile
      ? pies.map((pie) => ({
          key: pie.key,
          label: pie.label,
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
              <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
                {pies.map((pie) => (
                  <div key={pie.key} className="flex min-h-0 flex-col rounded-lg border bg-white p-5">
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

  return <SectionPager sections={sections} />;
}

export default function StatsPage() {
  const [tab, setTab] = useState<Tab>("books");

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col">
      <PageHeader
        title="統計"
        action={
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <TabButton active={tab === "books"} onClick={() => setTab("books")}>
              書籍
            </TabButton>
            <TabButton active={tab === "articles"} onClick={() => setTab("articles")}>
              文章
            </TabButton>
          </div>
        }
      />
      {tab === "books" ? <BooksStats /> : <ArticlesStats />}
    </div>
  );
}
