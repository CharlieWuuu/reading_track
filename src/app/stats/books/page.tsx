"use client";

import { Suspense } from "react";
import { DataGate } from "@/components/layout/data-gate";
import { resolveView } from "@/config/stats-views";
import { MonthGrid } from "@/features/calendar/components/month-grid";
import { ReadingTimeline } from "@/features/calendar/components/reading-timeline";
import { BooksStats } from "@/features/stats/components/books-stats";
import { useBooks } from "@/hooks/use-books";
import { useUrlParams } from "@/hooks/use-url-param";

/**
 * 三種看法在這裡分岔而不是在 feature 裡：`features/stats` 不准 import
 * `features/calendar`（eslint 的邊界），app 這層才是它們的交會處。
 */
function BooksStatsView() {
  const { searchParams } = useUrlParams();
  const view = resolveView("books", searchParams.get("view"));
  const { books, isLoading, error } = useBooks();

  if (view === "chart") return <BooksStats />;

  return (
    <DataGate isLoading={isLoading} error={error} fill>
      {view === "calendar" ? (
        <MonthGrid books={books} articles={[]} />
      ) : (
        <ReadingTimeline books={books} />
      )}
    </DataGate>
  );
}

export default function BooksStatsPage() {
  return (
    <Suspense fallback={null}>
      <BooksStatsView />
    </Suspense>
  );
}
