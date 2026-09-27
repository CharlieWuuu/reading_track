"use client";

import { IssueLinks } from "@/components/layout/issue-links";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { OverviewHeadline } from "@/components/ui/overview-layout/overview-headline";
import { unitOfGroup } from "@/config/nav";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { useGroupRecords } from "@/hooks/use-group-records";
import { useKinds } from "@/hooks/use-kinds";
import { styledFragment, styledRecord } from "@/utils/card-data";
import { countOnDate, fragmentDate, pickHeadline, recentBy, recordDate } from "@/utils/home-digest";
import { moduleKeysByKind, statusOf } from "@/utils/kind-list";
import { recordItem as recordOverviewItem } from "@/utils/overview-items";
import { DigestColumn } from "./digest-column";
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
  emptyBand: "border-rule-strong flex flex-col gap-5 border-b pb-5 @2xl:flex-row @2xl:gap-8",
};

export function Dashboard() {
  const records = useGroupRecords("records");
  const fragments = useGroupFragments("fragments");
  const writings = useGroupFragments("writings");
  const { kinds } = useKinds();

  const error = records.error ?? fragments.error ?? writings.error;
  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (records.isLoading || fragments.isLoading || writings.isLoading) return <PageLoading />;

  const today = new Date().toISOString().slice(0, 10);

  const keysByKind = moduleKeysByKind(kinds);
  const headline = pickHeadline(records.records, keysByKind);
  const todayPanel = (
    <>
      {/* 內容欄窄時橫著分隔，寬時變成直線 */}
      <div className="bg-rule h-px w-full shrink-0 @2xl:h-auto @2xl:w-px" />
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
    </>
  );

  return (
    <div className="flex min-h-full flex-1 flex-col overflow-y-auto pb-10">
      <div className={styles.head}>
        <h1 className={styles.title}>今天</h1>
        {/* 手機沒有報頭，這行是唯一進得去回顧頁的入口——桌機的報頭也是同一份 */}
        <IssueLinks className={styles.meta} />
      </div>

      {headline ? (
        <OverviewHeadline
          item={recordOverviewItem(headline)}
          label={
            statusOf(headline, keysByKind.get(headline.kindId)) === "reading" ? "在讀" : "最近讀完"
          }
          aside={todayPanel}
        />
      ) : (
        // 一筆紀錄都沒有時沒有主角可以當頭條，只剩「這個月」
        <div className={styles.emptyBand}>
          <p className="text-byline text-ink-muted flex-1">還沒有紀錄</p>
          {todayPanel}
        </div>
      )}

      <div className="flex flex-col gap-6 pt-5 @2xl:flex-row @2xl:gap-7">
        <DigestColumn
          title="最近的紀錄"
          total={records.records.length}
          cards={recentBy(records.records, recordDate, 3).map(styledRecord)}
          unit={unitOfGroup("records")}
          href="/records"
        />
        <DigestColumn
          title="最近的片段"
          total={fragments.fragments.length}
          cards={recentBy(fragments.fragments, fragmentDate, 3).map(styledFragment)}
          unit={unitOfGroup("fragments")}
          href="/fragments"
        />
        <DigestColumn
          title="最近的書寫"
          total={writings.fragments.length}
          cards={recentBy(writings.fragments, fragmentDate, 3).map(styledFragment)}
          unit={unitOfGroup("writings")}
          href="/writings"
        />
      </div>
    </div>
  );
}
