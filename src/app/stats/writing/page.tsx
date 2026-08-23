"use client";

import { Suspense } from "react";
import { DataGate } from "@/components/layout/data-gate";
import { resolveView } from "@/config/stats-views";
import { MonthGrid } from "@/features/calendar/components/month-grid";
import { WritingStats } from "@/features/stats/components/writing-stats";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";

function WritingStatsView() {
  const { searchParams } = useUrlParams();
  const view = resolveView("writing", searchParams.get("view"));
  const { writings, isLoading, error } = useWritings();

  if (view === "chart") return <WritingStats />;

  return (
    <DataGate isLoading={isLoading} error={error} fill>
      <MonthGrid writings={writings} />
    </DataGate>
  );
}

export default function WritingStatsPage() {
  return (
    <Suspense fallback={null}>
      <WritingStatsView />
    </Suspense>
  );
}
