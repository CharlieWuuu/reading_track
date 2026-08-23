"use client";

import { Suspense } from "react";
import { DataGate } from "@/components/layout/data-gate";
import { resolveView } from "@/config/stats-views";
import { MonthGrid } from "@/features/calendar/components/month-grid";
import { ArticlesStats } from "@/features/stats/components/articles-stats";
import { useArticles } from "@/hooks/use-articles";
import { useUrlParams } from "@/hooks/use-url-param";

function ArticlesStatsView() {
  const { searchParams } = useUrlParams();
  const view = resolveView("articles", searchParams.get("view"));
  const { articles, isLoading, error } = useArticles();

  if (view === "chart") return <ArticlesStats />;

  return (
    <DataGate isLoading={isLoading} error={error} fill>
      <MonthGrid books={[]} articles={articles} />
    </DataGate>
  );
}

export default function ArticlesStatsPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesStatsView />
    </Suspense>
  );
}
