"use client";

import { TabBar } from "@/components/ui/controls";
import { useUrlParams } from "@/hooks/use-url-param";

export type EntryFormTab = "text" | "tags";

/**
 * 內文是主體，其他欄位都是為了讓它之後找得到，所以分兩頁。
 * 「標記」沿用書籍表單的講法：自己貼上去的東西。
 */
const TABS: { key: EntryFormTab; label: string }[] = [
  { key: "text", label: "內文" },
  { key: "tags", label: "標記" },
];

export function useEntryFormTab() {
  const { searchParams, setParams } = useUrlParams();
  const param = searchParams.get("tab");
  const tab: EntryFormTab = TABS.some((t) => t.key === param) ? (param as EntryFormTab) : "text";
  const setTab = (next: EntryFormTab) => setParams({ tab: next === "text" ? null : next });
  return { tab, setTab };
}

/** 表單的分頁列，放在頁首的操作區 */
export function EntryFormTabs() {
  const { tab, setTab } = useEntryFormTab();
  return <TabBar items={TABS} value={tab} onChange={setTab} />;
}
