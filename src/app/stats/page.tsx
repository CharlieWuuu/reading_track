"use client";

import { useState } from "react";
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
  getYearlyTrend,
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

function BooksStats() {
  const { sheetId } = useSheetStore();
  const { books, isLoading, error } = useBooks();

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
  const yearly = getYearlyTrend(books);
  const quarterly = getQuarterlyTrend(books);
  const monthly = getMonthlyTrend(books);

  return (
    <div className="space-y-6">
      <KpiCards {...kpis} />

      <div className="rounded-lg border bg-white p-5">
        <p className="mb-2 text-sm font-medium">歷年完成本數</p>
        <YearlyTrendChart data={yearly} quarterlyData={quarterly} />
      </div>

      <div className="rounded-lg border bg-white p-5">
        <p className="mb-2 text-sm font-medium">近 24 個月完成趨勢</p>
        <MonthlyTrendChart data={monthly} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-5">
          <DistributionPie title="領域分布" data={getDomainDistribution(books)} />
        </div>
        <div className="rounded-lg border bg-white p-5">
          <DistributionPie title="屬性分布" data={getTypeDistribution(books)} />
        </div>
        <div className="rounded-lg border bg-white p-5">
          <DistributionPie title="語言分布" data={getLanguageDistribution(books)} />
        </div>
        <div className="rounded-lg border bg-white p-5">
          <DistributionPie title="平台分布" data={getPlatformDistribution(books)} />
        </div>
      </div>
    </div>
  );
}

function ArticlesStats() {
  const { token } = useInstapaperStore();
  const { articles, isLoading, error } = useArticles();

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

  return (
    <div className="space-y-6">
      <ArticleKpiCards {...kpis} />

      <div className="rounded-lg border bg-white p-5">
        <p className="mb-2 text-sm font-medium">近 24 個月完成趨勢</p>
        <MonthlyTrendChart data={monthly} unit="篇" seriesLabel="完成篇數" />
      </div>

      <div className="rounded-lg border bg-white p-5">
        <p className="mb-2 text-sm font-medium">
          資料夾趨勢（實線＝已完成、虛線＝未完成）
        </p>
        <FolderTrendChart data={folderTrend.data} series={folderTrend.series} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-5">
          <DistributionPie
            title="已完成／未完成"
            data={getCompletionDistribution(articles)}
            unit="篇"
          />
        </div>
        <div className="rounded-lg border bg-white p-5">
          <DistributionPie
            title="資料夾分布"
            data={getFolderDistribution(articles)}
            unit="篇"
          />
        </div>
        <div className="rounded-lg border bg-white p-5">
          <DistributionPie
            title="來源網站分布（已完成）"
            data={getSourceDistribution(articles)}
            unit="篇"
          />
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [tab, setTab] = useState<Tab>("books");

  return (
    <div className="mx-auto max-w-5xl">
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
