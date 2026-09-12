"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { CardMasonry } from "@/components/ui/card-masonry";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { GroupTable } from "@/components/ui/group-table/group-table";
import { OverviewHeadline } from "@/components/ui/overview-layout/overview-headline";
import { KindGroup } from "@/config/record-kinds";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { fragmentHref, fragmentItem, fragmentMeta, fragmentTitle } from "@/utils/overview-items";

const styles = {
  empty: "text-meta text-ink-faint py-8 text-center",
};

/**
 * 片段與專欄的概覽。兩者同一張表，但排法不同。
 *
 * 片段是卡片牆——跟關鍵字（KeywordCards）同一套視覺語言：一則一張卡、grid 同列等高排版。
 * 最上面提一則頭條，跟其餘概覽頁一致：一頁只有一個主角。
 * 專欄照月份排成封面格線，跟底下的書寫子頁一致；沒有「進行中」，全部當成完成的排。
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

  // 一頁一個主角：最新記下的那一則提到最上面，其餘照原本的順序排在卡片牆裡
  const [headline, ...rest] = fragments;

  return (
    <div className="flex flex-col gap-5">
      <OverviewHeadline
        item={fragmentItem(headline)}
        label="最新一則"
        summary={headline.body || undefined}
      />
      <CardMasonry>
        {rest.map((row) => (
          <FragmentCard
            key={row.id}
            href={fragmentHref(row)}
            title={fragmentTitle(row)}
            label={row.kindName}
            body={row.body}
            meta={fragmentMeta(row)}
            coverUrl={row.coverUrl}
          />
        ))}
      </CardMasonry>
    </div>
  );
}
