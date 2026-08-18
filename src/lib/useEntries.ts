import { useMemo } from "react";
import useSWR from "swr";
import { readCached } from "@/lib/swrCache";
import { useSheetStore } from "@/store/useSheetStore";
import { Entry } from "@/types/entry";

async function fetcher(url: string): Promise<{ entries: Entry[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

/**
 * 由新到舊；沒填日期的排最後。
 *
 * 同一天的維持 Sheet 上的列序（sort 是穩定的），也就是你當初寫下的先後——
 * 拿標題去排只會得到一個跟你無關的順序。
 */
function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function useEntries() {
  const { sheetId } = useSheetStore();
  const key = sheetId ? `/api/entries?sheetId=${encodeURIComponent(sheetId)}` : null;

  // 先用上次存下來的資料把畫面畫出來，再於背景重新抓
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetcher, {
    fallbackData: readCached<{ entries: Entry[] }>(key),
  });

  const entries = useMemo(() => sortEntries(data?.entries ?? []), [data?.entries]);

  return {
    entries,
    // 已經有舊資料墊著就不算「載入中」，理由同 useBooks
    isLoading: isLoading && entries.length === 0,
    isValidating,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
