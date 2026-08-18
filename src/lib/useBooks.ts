import { useMemo } from "react";
import useSWR from "swr";
import { readCached } from "@/lib/swrCache";
import { usePrivacyStore } from "@/store/usePrivacyStore";
import { useSheetStore } from "@/store/useSheetStore";
import { Book, ReadingStatus } from "@/types/book";

async function fetcher(url: string): Promise<{ books: Book[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

// 想讀擺最前面：那是「接下來要看什麼」的清單，最常被翻。
// status 已由 sheets.ts 正規化過（沒填的會用日期推算），這裡直接信任它。
const STATUS_ORDER: Record<ReadingStatus, number> = {
  想讀: 0,
  閱讀中: 1,
  已讀完: 2,
};

function sortBooks(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    // 同狀態內用日期由新到舊；沒日期的排後面
    const aDate = a.endDate ?? a.startDate ?? "";
    const bDate = b.endDate ?? b.startDate ?? "";
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return a.title.localeCompare(b.title, "zh-Hant");
  });
}

export function useBooks() {
  const { sheetId } = useSheetStore();
  // 解鎖權杖進 key：鎖上／解鎖是兩份不同的快取，鎖上時不會看到剛才的私人資料
  const unlock = usePrivacyStore((s) => s.token);
  const key = sheetId
    ? `/api/books?sheetId=${encodeURIComponent(sheetId)}${unlock ? `&unlock=${unlock}` : ""}`
    : null;

  // 先用上次存下來的資料把畫面畫出來，再於背景重新抓
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetcher, {
    fallbackData: readCached<{ books: Book[] }>(key),
  });

  const books = useMemo(() => sortBooks(data?.books ?? []), [data?.books]);

  return {
    books,
    // 已經有舊資料墊著就不算「載入中」——背景重抓不該把畫面換成載入中再換回來
    isLoading: isLoading && books.length === 0,
    isValidating,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
