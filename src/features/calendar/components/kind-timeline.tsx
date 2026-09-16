"use client";

import { useMemo } from "react";
import { DataGate } from "@/components/layout/data-gate";
import { SpanTimeline } from "@/features/calendar/components/span-timeline";
import { recordsToTimeline } from "@/features/calendar/utils/to-entries";
import { useKindRecords } from "@/hooks/use-kind-records";
import type { Kind } from "@/lib/db/queries/kinds";

/**
 * 某一種類型的數線。只有紀錄畫得出來——片段與書寫沒有開始日期，
 * 一段期間要兩格日期才成立（`viewsOfModules` 也是這樣判的）。
 */
export function KindTimeline({ kind }: { kind: Kind }) {
  const { records, isLoading, error } = useKindRecords(kind.id);
  const items = useMemo(() => recordsToTimeline(records), [records]);

  return (
    <DataGate isLoading={isLoading} error={error} fill>
      <SpanTimeline items={items} />
    </DataGate>
  );
}
