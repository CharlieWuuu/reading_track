import { useMemo } from "react";
import useSWR from "swr";
import { readCached } from "@/lib/swrCache";
import { usePrivacyStore } from "@/store/usePrivacyStore";
import { useSheetStore } from "@/store/useSheetStore";
import { Article } from "@/types/article";

async function fetcher(url: string): Promise<{ articles: Article[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

/** 只有一個日期，直接由新到舊；沒填日期的排最後，那是還沒讀完的 */
function sortArticles(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    const aDate = a.endDate ?? "";
    const bDate = b.endDate ?? "";
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return a.title.localeCompare(b.title, "zh-Hant");
  });
}

export function useArticles() {
  const { sheetId } = useSheetStore();
  // 解鎖權杖進 key：鎖上／解鎖是兩份不同的快取，鎖上時不會看到剛才的私人資料
  const unlock = usePrivacyStore((s) => s.token);
  const key = sheetId
    ? `/api/articles?sheetId=${encodeURIComponent(sheetId)}${unlock ? `&unlock=${unlock}` : ""}`
    : null;

  // 先用上次存下來的資料把畫面畫出來，再於背景重新抓
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetcher, {
    fallbackData: readCached<{ articles: Article[] }>(key),
  });

  const articles = useMemo(() => sortArticles(data?.articles ?? []), [data?.articles]);

  return {
    articles,
    // 已經有舊資料墊著就不算「載入中」，理由同 useBooks
    isLoading: isLoading && articles.length === 0,
    isValidating,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
