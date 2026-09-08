"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { useGroupRecords } from "@/hooks/use-group-records";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import {
  countInMonth,
  fragmentDate,
  pickHeadline,
  recentBy,
  recordDate,
  streakDays,
} from "@/utils/home-digest";
import { DigestColumn, DigestItem } from "./digest-column";
import { TodayHeadline } from "./today-headline";

/**
 * 登入後的首頁。三堆各取最近三筆，上面壓一則頭條與這個月的數字。
 *
 * 三堆各自一支 SWR，哪一堆慢就哪一堆晚到，不互相擋。
 */

const styles = {
  head: "flex items-baseline gap-3.5 pb-2.5",
  title: "font-serif text-page tracking-tight font-semibold",
  meta: "text-meta text-ink-faint tabular-nums",
};

const recordItem = (row: RecordRow): DigestItem => ({
  id: row.id,
  kind: row.kindName,
  date: (recordDate(row) ?? "").slice(5),
  title: row.title,
  meta: [row.creator, row.amount && `${row.amount} ${row.amountUnit}`]
    .filter(Boolean)
    .join("　·　"),
});

const fragmentItem = (row: FragmentRow): DigestItem => ({
  id: row.id,
  kind: row.kindName,
  date: (fragmentDate(row) ?? "").slice(5),
  title: row.name || row.body,
  meta: [row.workTitle, row.locator].filter(Boolean).join("　·　"),
});

export function Dashboard() {
  const records = useGroupRecords("records");
  const fragments = useGroupFragments("fragments");
  const writings = useGroupFragments("writings");

  const error = records.error ?? fragments.error ?? writings.error;
  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (records.isLoading || fragments.isLoading || writings.isLoading) return <PageLoading />;

  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const dates = [
    ...records.records.map(recordDate),
    ...fragments.fragments.map(fragmentDate),
    ...writings.fragments.map(fragmentDate),
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className={styles.head}>
        <h1 className={styles.title}>今天</h1>
        <span className={styles.meta}>{today}</span>
      </div>

      <TodayHeadline
        headline={pickHeadline(records.records)}
        month={month.slice(5)}
        counts={[
          {
            label: "紀錄",
            unit: "筆",
            value: countInMonth(records.records.map(recordDate), month),
          },
          {
            label: "片段",
            unit: "則",
            value: countInMonth(fragments.fragments.map(fragmentDate), month),
          },
          {
            label: "專欄",
            unit: "篇",
            value: countInMonth(writings.fragments.map(fragmentDate), month),
          },
        ]}
        streak={streakDays(dates, today)}
      />

      <div className="flex gap-7 pt-5">
        <DigestColumn
          title="最近的紀錄"
          total={records.records.length}
          items={recentBy(records.records, recordDate, 3).map(recordItem)}
          href="/records"
        />
        <DigestColumn
          title="最近的片段"
          total={fragments.fragments.length}
          items={recentBy(fragments.fragments, fragmentDate, 3).map(fragmentItem)}
          href="/fragments"
        />
        <DigestColumn
          title="最近的專欄"
          total={writings.fragments.length}
          items={recentBy(writings.fragments, fragmentDate, 3).map(fragmentItem)}
          href="/writings"
        />
      </div>
    </div>
  );
}
