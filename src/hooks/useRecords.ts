"use client";

import useSWR from "swr";
import { readCached } from "@/lib/swrCache";
import { usePrivacyStore } from "@/store/usePrivacyStore";
import { useSheetStore } from "@/store/useSheetStore";
import { QuoteRow, VocabularyRow } from "@/types/record";

type Records = { vocabulary: VocabularyRow[]; quotes: QuoteRow[] };

async function fetcher(url: string): Promise<Records> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

/** 單字與佳句各自一張表，一起讀：它們總是一起顯示，分兩次抓只是多一趟往返 */
export function useRecords() {
  const { sheetId } = useSheetStore();
  // 佳句、單字跟著它那本書的私人設定，所以也要帶解鎖權杖
  const unlock = usePrivacyStore((s) => s.token);
  const key = sheetId
    ? `/api/records?sheetId=${encodeURIComponent(sheetId)}${unlock ? `&unlock=${unlock}` : ""}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    fallbackData: readCached<Records>(key),
  });

  /** 一本書的紀錄整批換掉，跟後端同一個約定 */
  async function saveBookRows(
    kind: "vocabulary" | "quotes",
    bookId: string,
    bookTitle: string,
    rows: VocabularyRow[] | QuoteRow[],
  ) {
    if (!sheetId) throw new Error("請先連接 Google Sheet");
    const res = await fetch("/api/records", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId, kind, bookId, bookTitle, rows }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "儲存失敗");
    }
    await mutate();
  }

  return {
    vocabulary: data?.vocabulary ?? [],
    quotes: data?.quotes ?? [],
    // 已經有舊資料墊著就不算「載入中」，理由同 useBooks
    isLoading: isLoading && !data,
    error: error instanceof Error ? error.message : undefined,
    saveBookRows,
    mutate,
  };
}
