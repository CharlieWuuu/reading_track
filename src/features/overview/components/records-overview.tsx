"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { useGroupRecords } from "@/hooks/use-group-records";
import { useGroupRecordsOverview } from "@/hooks/use-group-records-overview";
import { recordItem } from "@/utils/overview-items";
import { GroupTable } from "./group-table";

/**
 * 紀錄那一堆的概覽：書籍、文章、之後的電影都混在同一份清單裡排。
 *
 * 讀的是新表。舊的 books／articles 路由還在，兩套並存到確認過為止。
 *
 * table 檢視要整包資料（排序、篩選都在前端做），overview 檢視用分頁 hook——
 * 兩支 hook 都無條件呼叫，只是畫面依 view 決定用哪一份，不能因為 view 才決定要不要呼叫 hook。
 */
export function RecordsOverview({ view = "overview" }: { view?: "overview" | "table" }) {
  const table = useGroupRecords("records");
  const overview = useGroupRecordsOverview("records");

  if (view === "table") {
    if (table.error) return <PageMessage tone="error">{table.error}</PageMessage>;
    if (table.isLoading) return <PageLoading />;
    return <GroupTable items={table.records.map(recordItem)} onSaved={table.mutate} />;
  }

  if (overview.error) return <PageMessage tone="error">{overview.error}</PageMessage>;
  if (overview.isLoading) return <PageLoading />;

  const pending = overview.active.filter((row) => row.statusKey === "want").map(recordItem);
  const active = overview.active.filter((row) => row.statusKey === "reading").map(recordItem);
  const done = overview.done.map(recordItem);

  return (
    <GroupOverview
      active={active}
      pending={pending}
      done={done}
      doneTotal={overview.doneTotal}
      headlineLabel="在讀 · 最近開始的一本"
      unit="筆"
      onLoadMore={overview.loadMore}
      hasMore={overview.hasMore}
      isLoadingMore={overview.isLoadingMore}
    />
  );
}
