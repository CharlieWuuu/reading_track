"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { useInstapaperStore } from "@/store/useInstapaperStore";
import { useArticles } from "@/lib/useArticles";
import { ArticleKpiCards } from "@/components/stats/ArticleKpiCards";
import { MonthlyTrendChart } from "@/components/stats/MonthlyTrendChart";
import { DistributionPie } from "@/components/stats/DistributionPie";
import { FolderTrendChart } from "@/components/stats/FolderTrendChart";
import {
  getArticleKpis,
  getArticleMonthlyTrend,
  getCompletionDistribution,
  getFolderDistribution,
  getFolderMonthlyTrend,
  getSourceDistribution,
} from "@/lib/articleStats";

export default function ArticleStatsPage() {
  const { token } = useInstapaperStore();
  const { articles, isLoading, error } = useArticles();

  if (!token) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="文章統計" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          請先到「設定」頁面連接 Instapaper
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="文章統計" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          載入中…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="文章統計" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="文章統計" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          尚無文章
        </div>
      </div>
    );
  }

  const kpis = getArticleKpis(articles);
  const monthly = getArticleMonthlyTrend(articles);
  const folderTrend = getFolderMonthlyTrend(articles);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="文章統計" />

      <ArticleKpiCards {...kpis} />

      <div className="rounded-lg border bg-white p-5">
        <p className="mb-2 text-sm font-medium">近 24 個月讀完趨勢</p>
        <MonthlyTrendChart data={monthly} unit="篇" seriesLabel="讀完篇數" />
      </div>

      <div className="rounded-lg border bg-white p-5">
        <p className="mb-2 text-sm font-medium">
          資料夾趨勢（實線＝已讀完、虛線＝未讀完）
        </p>
        <FolderTrendChart data={folderTrend.data} series={folderTrend.series} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-5">
          <DistributionPie
            title="讀完 / 未讀完"
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
            title="來源網站分布（已讀完）"
            data={getSourceDistribution(articles)}
            unit="篇"
          />
        </div>
      </div>
    </div>
  );
}
