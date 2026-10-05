"use client";

import { useMemo } from "react";
import { DataGate } from "@/components/layout/data-gate";
import { Panel } from "@/components/ui/panel/panel";
import { MonthGrid } from "@/features/calendar/components/month-grid";
import { MonthNav } from "@/features/calendar/components/month-nav";
import { useMonthNav } from "@/features/calendar/hooks/use-month-nav";
import { fragmentsToEntries, recordsToEntries } from "@/features/calendar/utils/to-entries";
import { useKindRecords } from "@/hooks/use-kind-records";
import type { Kind } from "@/lib/db/queries/kinds";

/**
 * 某一種類型的月曆。撈資料與攤平在這裡，格子怎麼畫在 MonthGrid。
 * 外框自己畫：換月鈕擺在卡片標題右側，要跟格子共用同一份月份。
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

  const nav = useMonthNav();

  return (
    <Panel title="月曆" titleAction={<MonthNav nav={nav} />}>
      <DataGate isLoading={isLoading} error={error} fill>
        <MonthGrid
          key={`${nav.year}-${nav.month}`} // 換月重掛：選取日、彈窗回到新月份
          year={nav.year}
          month={nav.month}
          entries={entries}
        />
      </DataGate>
    </Panel>
  );
}
