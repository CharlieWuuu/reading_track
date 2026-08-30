"use client";

import { SegmentedControl } from "@/components/ui/controls";
import { useUrlParams } from "@/hooks/use-url-param";

export type BookFormTab = "book" | "record";

/**
 * 兩頁：「這本書是什麼」與「我從裡面留下什麼」。
 *
 * 原本切成四頁（書籍／標記／摘錄／筆記），但「摘錄」「筆記」全站別的地方
 * 叫佳句、單字、書寫——同一個東西在兩處換名字。標記也不值得自己一頁，
 * 它跟書籍欄位一樣是填表。
 */
const TABS: { key: BookFormTab; label: string }[] = [
  { key: "book", label: "書籍" },
  { key: "record", label: "紀錄" },
];

/** 舊網址還帶著四頁時期的 tab，對過來才不會退回第一頁 */
const LEGACY: Record<string, BookFormTab> = {
  tags: "book",
  excerpt: "record",
  notes: "record",
};

/**
 * 看哪一頁寫在網址上，重新整理或分享連結都回得到同一個分頁；預設書籍。
 * 分頁列在頁首、表單在下面，兩邊各自呼叫這個 hook 讀同一個參數。
 */
export function useBookFormTab() {
  const { searchParams, setParams } = useUrlParams();
  const param = searchParams.get("tab") ?? "";
  const tab: BookFormTab = TABS.some((t) => t.key === param)
    ? (param as BookFormTab)
    : (LEGACY[param] ?? "book");
  const setTab = (next: BookFormTab) => setParams({ tab: next === "book" ? null : next });
  return { tab, setTab };
}

/** 表單的分頁列，放在頁首的操作區 */
export function BookFormTabs() {
  const { tab, setTab } = useBookFormTab();
  return <SegmentedControl items={TABS} value={tab} onChange={setTab} />;
}
