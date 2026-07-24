"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";
import { KpiCards } from "@/components/stats/KpiCards";
import { YearlyTrendChart } from "@/components/stats/YearlyTrendChart";
import { MonthlyTrendChart } from "@/components/stats/MonthlyTrendChart";
import { DistributionPie } from "@/components/stats/DistributionPie";
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

export default function StatsPage() {
  const { sheetId } = useSheetStore();
  const { books, isLoading, error } = useBooks();

  if (!sheetId) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="統計圖表" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          請先到「設定」頁面連接 Google Sheet
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="統計圖表" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          載入中…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="統計圖表" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="統計圖表" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          尚未新增任何書籍
        </div>
      </div>
    );
  }

  const kpis = getKpis(books);
  const yearly = getYearlyTrend(books);
  const quarterly = getQuarterlyTrend(books);
  const monthly = getMonthlyTrend(books);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="統計圖表" />

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
