"use client";

import { TabBar } from "@/components/ui/controls";
import { useUrlParams } from "@/hooks/use-url-param";

export type JournalFormTab = "text" | "tags";

/**
 * 內文是主體，其他欄位都是為了讓它之後找得到，所以分兩頁。
 * 「標記」沿用書籍表單的講法：自己貼上去的東西。
 */
const TABS: { key: JournalFormTab; label: string }[] = [
  { key: "text", label: "內文" },
  { key: "tags", label: "標記" },
];

export function useJournalFormTab() {
  const { searchParams, setParams } = useUrlParams();
  const param = searchParams.get("tab");
  const tab: JournalFormTab = TABS.some((t) => t.key === param)
    ? (param as JournalFormTab)
    : "text";
  const setTab = (next: JournalFormTab) => setParams({ tab: next === "text" ? null : next });
  return { tab, setTab };
}

/** 表單的分頁列，放在頁首的操作區 */
export function JournalFormTabs() {
  const { tab, setTab } = useJournalFormTab();
  return <TabBar items={TABS} value={tab} onChange={setTab} />;
}
