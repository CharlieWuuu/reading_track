"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { GroupTable } from "@/components/ui/group-table/group-table";
import { OverviewHeadline } from "@/components/ui/overview-layout/overview-headline";
import { KindGroup } from "@/config/record-kinds";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { useGroupRecords } from "@/hooks/use-group-records";
import { useGroupRecordsOverview } from "@/hooks/use-group-records-overview";
import { useMounted } from "@/hooks/use-mounted";
import { fragmentItem, recordItem } from "@/utils/overview-items";
import { sectionsByKind } from "@/utils/overview-sections";
import { KindSectionBlock } from "./kind-section";

const styles = {
  empty: "text-meta text-ink-faint py-8 text-center",
  sections: "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto", // PageBody 是 scroll={false}，捲動歸這裡
};

type GroupOverviewPageProps = {
  group: KindGroup;
  view?: "overview" | "table";
};

/**
 * 三個 group 的概覽。紀錄讀 records 那兩支 hook，片段與書寫讀 fragments 那支。
 *
 * hook 一律無條件呼叫，只是畫面依 group／view 決定用哪一份——不能因為分支才決定要不要呼叫。
 */
export function GroupOverviewPage({ group, view = "overview" }: GroupOverviewPageProps) {
  const isRecords = group === "records";
  const table = useGroupRecords("records");
  const recordsOverview = useGroupRecordsOverview("records");
  const fragmentsData = useGroupFragments(group);
  const mounted = useMounted();

  if (!mounted) return null; // 靜態那份 HTML 一定是空的，先判斷資料狀態會閃一下「空的」

  if (isRecords) {
    const source = view === "table" ? table : recordsOverview;
    if (source.error) return <PageMessage tone="error">{source.error}</PageMessage>;
    if (source.isLoading) return <PageLoading />;

    if (view === "table")
      return <GroupTable items={table.records.map(recordItem)} onSaved={table.mutate} />;

    return (
      <GroupOverview
        active={recordsOverview.active.filter((r) => r.statusKey === "reading").map(recordItem)}
        pending={recordsOverview.active.filter((r) => r.statusKey === "want").map(recordItem)}
        done={recordsOverview.done.map(recordItem)}
        doneTotal={recordsOverview.doneTotal}
        headlineLabel="在讀 · 最近開始的一本"
        unit="筆"
        onLoadMore={recordsOverview.loadMore}
        hasMore={recordsOverview.hasMore}
        isLoadingMore={recordsOverview.isLoadingMore}
      />
    );
  }

  const { fragments, isLoading, error, mutate } = fragmentsData;
  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (isLoading) return <PageLoading />;
  if (view === "table") return <GroupTable items={fragments.map(fragmentItem)} onSaved={mutate} />;
  if (fragments.length === 0) return <div className={styles.empty}>還沒有任何紀錄</div>;

  // 書寫照月份排，跟底下的書寫子頁一致；沒有進行中，全部當成完成的排
  if (group === "writings") {
    return (
      <GroupOverview
        active={[]}
        pending={[]}
        done={fragments.map(fragmentItem)}
        headlineLabel="最新一則"
        unit="則"
      />
    );
  }

  // 頭條是「這一頁在講什麼」，底下分區是「有哪些」，兩件事，所以頭條那則照樣列在分區裡
  const [headline] = fragments;

  return (
    <div className={styles.sections}>
      <OverviewHeadline
        item={fragmentItem(headline)}
        label="最新一則"
        summary={headline.body || undefined}
      />
      {sectionsByKind(fragments).map((section) => (
        <KindSectionBlock key={section.slug} group={group} section={section} />
      ))}
    </div>
  );
}
