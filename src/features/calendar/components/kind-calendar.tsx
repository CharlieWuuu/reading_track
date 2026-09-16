"use client";

import { useMemo } from "react";
import { DataGate } from "@/components/layout/data-gate";
import { MonthGrid } from "@/features/calendar/components/month-grid";
import { fragmentsToEntries, recordsToEntries } from "@/features/calendar/utils/to-entries";
import { useKindRecords } from "@/hooks/use-kind-records";
import type { Kind } from "@/lib/db/queries/kinds";

/**
 * 某一種類型的月曆。撈資料與攤平在這裡，格子怎麼畫在 MonthGrid。
 *
 * 住在 calendar 而不是 stats：eslint 的邊界擋 `features/stats` import
 * `features/calendar`，反過來沒問題——月曆本來就是這個 feature 的事。
 */
export function KindCalendar({ kind }: { kind: Kind }) {
  const { records, fragments, isLoading, error } = useKindRecords(kind.id);
  const entries = useMemo(
    () => (kind.group === "records" ? recordsToEntries(records) : fragmentsToEntries(fragments)),
    [kind.group, records, fragments],
  );

  return (
    <DataGate isLoading={isLoading} error={error} fill>
      <MonthGrid entries={entries} />
    </DataGate>
  );
}
