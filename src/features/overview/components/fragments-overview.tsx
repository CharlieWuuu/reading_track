"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { KindGroup } from "@/config/record-kinds";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { fragmentItem } from "@/utils/overview-items";
import { GroupOverview } from "./group-overview";

/**
 * 片段與專欄的概覽。兩者同一張表、同一個版面，所以共用這一支。
 *
 * 沒有「進行中／完成」的狀態——一句話摘下來就是摘下來了，所以照記下的月份排，
 * 最近那一則當頭條。
 */
export function FragmentsOverview({
  group,
  headlineLabel,
}: {
  group: KindGroup;
  headlineLabel: string;
}) {
  const { fragments, isLoading, error } = useGroupFragments(group);

  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (isLoading) return <PageLoading />;

  const items = fragments.map(fragmentItem);

  return (
    <GroupOverview
      active={items.slice(0, 1)}
      pending={items.slice(1, 6)}
      done={items.slice(1)}
      headlineLabel={headlineLabel}
      activeLabel=""
      pendingLabel="最近"
    />
  );
}
