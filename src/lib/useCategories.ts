"use client";

import useSWR from "swr";
import { useArticles } from "@/lib/useArticles";
import { useBooks } from "@/lib/useBooks";
import { useEntries } from "@/lib/useEntries";
import { useSheetStore } from "@/store/useSheetStore";
import { BookCategories, categoryValue, DEFAULT_CATEGORIES, splitTags } from "@/types/book";

async function fetcher(url: string): Promise<{ categories: BookCategories }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取選項失敗");
  return data;
}

/** 自訂選項存在試算表的「選項」工作表，換裝置也還在 */
export function useCategories() {
  const { sheetId } = useSheetStore();
  const key = sheetId ? `/api/options?sheetId=${encodeURIComponent(sheetId)}` : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  const stored = data?.categories ?? DEFAULT_CATEGORIES;
  const { books } = useBooks();
  const { articles } = useArticles();
  const { entries } = useEntries();

  /**
   * 選單顯示的是「清單 ∪ 各種紀錄上實際用到的值」。
   *
   * 直接在 Sheet 上把某本書改成一個沒登錄過的領域，那個值馬上就選得到——
   * 選項表退回它真正的角色：一份你想維護才維護的清單，不是一個要記得同步的東西。
   */
  const categories: BookCategories = { ...stored };
  for (const key of Object.keys(stored) as (keyof BookCategories)[]) {
    const known = new Set(stored[key]);
    // 屬性一格可以放多個，領域雖然是單選，舊資料仍可能是頓號串起來的
    const used = [...books, ...articles, ...entries].flatMap((item) =>
      splitTags(categoryValue(item, key)),
    );
    const extra = [...new Set(used)].filter((value) => !known.has(value));
    if (extra.length > 0) categories[key] = [...stored[key], ...extra];
  }

  /** 就地更新畫面，同時寫回試算表 */
  async function save(next: BookCategories) {
    if (!sheetId) return;
    await mutate(
      async () => {
        const res = await fetch("/api/options", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, categories: next }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "儲存選項失敗");
        }
        return { categories: next };
      },
      { optimisticData: { categories: next }, rollbackOnError: true, revalidate: false },
    );
  }

  return {
    categories,
    /** 只有清單本身，不含從資料補進來的值——編輯清單時要改的是這一份 */
    stored,
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    save,
  };
}
