"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { useGroupRecords } from "@/hooks/use-group-records";
import { recordItem } from "@/utils/overview-items";
import { GroupTable } from "./group-table";

/**
 * 紀錄那一堆的概覽：書籍、文章、之後的電影都混在同一份清單裡排。
 *
 * 讀的是新表。舊的 books／articles 路由還在，兩套並存到確認過為止。
 */
export function RecordsOverview({ view = "overview" }: { view?: "overview" | "table" }) {
  const { records, isLoading, error } = useGroupRecords("records");

  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (isLoading) return <PageLoading />;

  const pick = (key: string) => records.filter((row) => row.statusKey === key).map(recordItem);

  if (view === "table") return <GroupTable items={records.map(recordItem)} />;

  return (
    <GroupOverview
      active={pick("reading")}
      pending={pick("want")}
      done={pick("done").sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? ""))}
      headlineLabel="在讀 · 最近開始的一本"
      activeLabel="其餘在讀"
      pendingLabel="想讀"
      coverSize="lg"
    />
  );
}
