"use client";

import { SCROLL_BOTTOM } from "@/components/layout/page-body";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { GroupTable } from "@/components/ui/group-table/group-table";
import { OverviewHeadline } from "@/components/ui/overview-layout/overview-headline";
import { KindGroup } from "@/config/record-kinds";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { fragmentItem } from "@/utils/overview-items";
import { sectionsByKind } from "@/utils/overview-sections";
import { KindSectionBlock } from "./kind-section";

const styles = {
  empty: "text-meta text-ink-faint py-8 text-center",
};

/**
 * 片段與書寫的概覽。兩者同一張表，但排法不同。
 *
 * 最上面提一則頭條，跟其餘概覽頁一致：一頁只有一個主角。底下按類型分區，
 * 一區露四筆再給「更多」——概覽是摘要不是清單，跟首頁「每個 group 一欄各三筆」
 * 同一套想法，只是往下降一層。每個類型保留自己的畫法（見 KindSectionBlock）。
 *
 * 書寫照月份排成封面格線，跟底下的書寫子頁一致；沒有「進行中」，全部當成完成的排。
 */
export function FragmentsOverview({
  group,
  view = "overview",
}: {
  group: KindGroup;
  view?: "overview" | "table";
}) {
  const { fragments, isLoading, error, mutate } = useGroupFragments(group);

  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (isLoading) return <PageLoading />;

  if (view === "table") return <GroupTable items={fragments.map(fragmentItem)} onSaved={mutate} />;

  if (fragments.length === 0) return <div className={styles.empty}>還沒有任何紀錄</div>;

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

  // 一頁一個主角：最新記下的那一則提到最上面。底下的分區照樣列它——
  // 頭條是「這一頁在講什麼」，清單是「有哪些」，兩件事
  const [headline] = fragments;
  const sections = sectionsByKind(fragments);

  // PageBody 收到 scroll={false}，捲動歸這裡——不開的話整頁卡住捲不動
  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto ${SCROLL_BOTTOM}`}>
      <OverviewHeadline
        item={fragmentItem(headline)}
        label="最新一則"
        summary={headline.body || undefined}
      />
      {sections.map((section) => (
        <KindSectionBlock key={section.slug} group={group} section={section} />
      ))}
    </div>
  );
}
