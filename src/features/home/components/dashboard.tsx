"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { OverviewHeadline } from "@/components/ui/overview-layout/overview-headline";
import { unitOfGroup } from "@/config/nav";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { useGroupRecords } from "@/hooks/use-group-records";
import { useKinds } from "@/hooks/use-kinds";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { styledFragment, styledRecord } from "@/utils/card-data";
import { itemsInRange, monthRange } from "@/utils/date-range";
import { pickHeadline } from "@/utils/home-digest";
import {
  fragmentsNewestFirst,
  moduleKeysByKind,
  recordsNewestFirst,
  statusOf,
} from "@/utils/kind-list";
import { recordItem as recordOverviewItem } from "@/utils/overview-items";
import { DigestColumn } from "./digest-column";
import { MonthPanel } from "./month-panel";

const styles = {
  head: "pb-2.5",
  title: "font-serif text-page font-semibold",
  // 沒有頭條可畫時的替身，線與間距跟 OverviewHeadline 對齊
  emptyBand: "border-rule-strong flex flex-col gap-5 border-b pb-5 @2xl:flex-row @2xl:gap-8",
};

// 登入後的首頁：頭條、這個月的數字、三個 group 這個月的每一筆
export function Dashboard() {
  const records = useGroupRecords("records");
  const fragments = useGroupFragments("fragments");
  const writings = useGroupFragments("writings");
  const { kinds } = useKinds();

  const error = records.error ?? fragments.error ?? writings.error;
  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (records.isLoading || fragments.isLoading || writings.isLoading) return <PageLoading />;

  const today = new Date().toISOString().slice(0, 10);
  const range = monthRange(today);
  const monthRecords = recordsNewestFirst(itemsInRange<RecordRow>(records.records, range));
  const monthFragments = fragmentsNewestFirst(
    itemsInRange<FragmentRow>(fragments.fragments, range),
  );
  const monthWritings = fragmentsNewestFirst(itemsInRange<FragmentRow>(writings.fragments, range));

  const keysByKind = moduleKeysByKind(kinds);
  const headline = pickHeadline(records.records, keysByKind);
  const monthPanel = (
    <>
      {/* 內容欄窄時橫著分隔，寬時變成直線 */}
      <div className="bg-rule h-px w-full shrink-0 @2xl:h-auto @2xl:w-px" />
      <MonthPanel
        counts={[
          { label: "紀錄", unit: unitOfGroup("records"), value: monthRecords.length },
          { label: "片段", unit: unitOfGroup("fragments"), value: monthFragments.length },
          { label: "書寫", unit: unitOfGroup("writings"), value: monthWritings.length },
        ]}
      />
    </>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className={styles.head}>
        <h1 className={styles.title}>{Number(today.slice(5, 7))}月</h1>
      </div>

      {headline ? (
        <OverviewHeadline
          item={recordOverviewItem(headline)}
          label={
            statusOf(headline, keysByKind.get(headline.kindId)) === "reading" ? "在讀" : "最近讀完"
          }
          summary={headline.body || undefined} // 兩行節錄，OverviewHeadline 負責截
          aside={monthPanel}
        />
      ) : (
        // 一筆紀錄都沒有時沒有主角可以當頭條，只剩「這個月」
        <div className={styles.emptyBand}>
          <p className="text-byline text-ink-muted flex-1">還沒有紀錄</p>
          {monthPanel}
        </div>
      )}

      <div className="flex flex-col gap-6 pt-5 @2xl:flex-row @2xl:gap-7">
        <DigestColumn
          title="紀錄"
          total={monthRecords.length}
          cards={monthRecords.map(styledRecord)}
          unit={unitOfGroup("records")}
          href="/records"
        />
        <DigestColumn
          title="片段"
          total={monthFragments.length}
          cards={monthFragments.map(styledFragment)}
          unit={unitOfGroup("fragments")}
          href="/fragments"
        />
        <DigestColumn
          title="書寫"
          total={monthWritings.length}
          cards={monthWritings.map(styledFragment)}
          unit={unitOfGroup("writings")}
          href="/writings"
        />
      </div>
    </div>
  );
}
