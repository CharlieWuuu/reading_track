"use client";

import useSWR from "swr";
import { useSheetStore } from "@/store/useSheetStore";
import { BookCategories, DEFAULT_CATEGORIES } from "@/types/book";

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

  const categories = data?.categories ?? DEFAULT_CATEGORIES;

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
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    save,
  };
}
