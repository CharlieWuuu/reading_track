"use client";

import { IssueLinks } from "@/components/layout/issue-links";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { OverviewHeadline } from "@/components/ui/overview-layout/overview-headline";
import { unitOfGroup } from "@/config/nav";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { useGroupRecords } from "@/hooks/use-group-records";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { countOnDate, fragmentDate, pickHeadline, recentBy, recordDate } from "@/utils/home-digest";
import { recordItem as recordOverviewItem } from "@/utils/overview-items";
import { DigestColumn, DigestItem } from "./digest-column";
import { TodayPanel } from "./today-panel";

/**
 * 登入後的首頁。三個 group 各取最近三筆，上面壓一則頭條與這個月的數字。
 *
 * 三個 group 各自一支 SWR，哪個 group 慢就哪個 group 晚到，不互相擋。
 */

const styles = {
  head: "flex items-baseline justify-between gap-3.5 pb-2.5",
  title: "font-serif text-page font-semibold",
  meta: "text-meta text-ink-faint tabular-nums",
  // 沒有頭條可畫時的替身，線與間距跟 OverviewHeadline 對齊
  emptyBand: "border-rule-strong flex flex-col gap-5 border-b pb-5 md:flex-row md:gap-8",
};

const recordItem = (row: RecordRow): DigestItem => ({
  id: row.id,
  kind: row.kindName,
  date: (recordDate(row) ?? "").slice(5),
  title: row.title,
  meta: [row.creator, row.amount && `${row.amount} ${row.amountUnit}`].filter(Boolean).join("・"),
  coverUrl: row.coverUrl,
});

const fragmentItem = (row: FragmentRow): DigestItem => ({
  id: row.id,
  kind: row.kindName,
  date: (fragmentDate(row) ?? "").slice(5),
  title: row.title || row.body,
  meta: [row.workTitle, row.locator].filter(Boolean).join("・"),
  coverUrl: row.coverUrl,
});

export function Dashboard() {
  const records = useGroupRecords("records");
  const fragments = useGroupFragments("fragments");
  const writings = useGroupFragments("writings");

  const error = records.error ?? fragments.error ?? writings.error;
  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (records.isLoading || fragments.isLoading || writings.isLoading) return <PageLoading />;

  const today = new Date().toISOString().slice(0, 10);

  const headline = pickHeadline(records.records);
  const todayPanel = (
    <TodayPanel
      date={today.slice(5)}
      counts={[
        { label: "紀錄", unit: "筆", value: countOnDate(records.records.map(recordDate), today) },
        {
          label: "片段",
          unit: "則",
          value: countOnDate(fragments.fragments.map(fragmentDate), today),
        },
        {
          label: "書寫",
          unit: "篇",
          value: countOnDate(writings.fragments.map(fragmentDate), today),
        },
      ]}
    />
  );

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className={styles.head}>
        <h1 className={styles.title}>今天</h1>
        {/* 手機沒有報頭，這行是唯一進得去回顧頁的入口——桌機的報頭也是同一份 */}
        <IssueLinks className={styles.meta} />
      </div>

      {headline ? (
        <OverviewHeadline
          item={recordOverviewItem(headline)}
          label={headline.statusKey === "reading" ? "在讀" : "最近讀完"}
          aside={todayPanel}
        />
      ) : (
        // 一筆紀錄都沒有時沒有主角可以當頭條，只剩「這個月」
        <div className={styles.emptyBand}>
          <p className="text-byline text-ink-muted flex-1">還沒有紀錄</p>
          {todayPanel}
        </div>
      )}

      <div className="flex flex-col gap-6 pt-5 md:flex-row md:gap-7">
        <DigestColumn
          title="最近的紀錄"
          total={records.records.length}
          items={recentBy(records.records, recordDate, 3).map(recordItem)}
          unit={unitOfGroup("records")}
          href="/records"
        />
        <DigestColumn
          title="最近的片段"
          total={fragments.fragments.length}
          items={recentBy(fragments.fragments, fragmentDate, 3).map(fragmentItem)}
          unit={unitOfGroup("fragments")}
          href="/fragments"
        />
        <DigestColumn
          title="最近的書寫"
          total={writings.fragments.length}
          items={recentBy(writings.fragments, fragmentDate, 3).map(fragmentItem)}
          unit={unitOfGroup("writings")}
          href="/writings"
        />
      </div>
    </div>
  );
}
