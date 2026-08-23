"use client";

import { SegmentedControl } from "@/components/ui/controls";
import { useUrlParams } from "@/hooks/use-url-param";

export type BookFormTab = "book" | "tags" | "excerpt" | "notes";

/**
 * 欄位多到一頁看不完，照「這東西是什麼」分頁：
 * 書籍是出版社定的事實、標記是自己貼上去的、摘錄是從書裡抄出來的、筆記是自己寫的。
 */
const TABS: { key: BookFormTab; label: string }[] = [
  { key: "book", label: "書籍" },
  { key: "tags", label: "標記" },
  { key: "excerpt", label: "摘錄" },
  { key: "notes", label: "筆記" },
];

/**
 * 看哪一頁寫在網址上，重新整理或分享連結都回得到同一個分頁；預設書籍。
 * 分頁列在頁首、表單在下面，兩邊各自呼叫這個 hook 讀同一個參數。
 */
export function useBookFormTab() {
  const { searchParams, setParams } = useUrlParams();
  const param = searchParams.get("tab");
  const tab: BookFormTab = TABS.some((t) => t.key === param) ? (param as BookFormTab) : "book";
  const setTab = (next: BookFormTab) => setParams({ tab: next === "book" ? null : next });
  return { tab, setTab };
}

/** 表單的分頁列，放在頁首的操作區 */
export function BookFormTabs() {
  const { tab, setTab } = useBookFormTab();
  return <SegmentedControl items={TABS} value={tab} onChange={setTab} />;
}
