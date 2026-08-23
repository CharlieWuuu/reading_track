"use client";

import { SegmentedControl } from "@/components/ui/controls";
import { useUrlParams } from "@/hooks/use-url-param";

export type ArticleFormTab = "article" | "tags" | "notes";

/** 跟書籍同一套分法：文章是這篇本身的事實，標記是自己貼上去的 */
const TABS: { key: ArticleFormTab; label: string }[] = [
  { key: "article", label: "文章" },
  { key: "tags", label: "標記" },
  { key: "notes", label: "筆記" },
];

/** 看哪一頁寫在網址上，重新整理或分享連結都回得到同一個分頁；預設文章 */
export function useArticleFormTab() {
  const { searchParams, setParams } = useUrlParams();
  const param = searchParams.get("tab");
  const tab: ArticleFormTab = TABS.some((t) => t.key === param)
    ? (param as ArticleFormTab)
    : "article";
  const setTab = (next: ArticleFormTab) => setParams({ tab: next === "article" ? null : next });
  return { tab, setTab };
}

/** 表單的分頁列，放在頁首的操作區 */
export function ArticleFormTabs() {
  const { tab, setTab } = useArticleFormTab();
  return <SegmentedControl items={TABS} value={tab} onChange={setTab} />;
}
