"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { readCached } from "@/lib/swr-cache";
import { usePrivacyStore } from "@/stores/use-privacy-store";
import { useSheetStore } from "@/stores/use-sheet-store";

/** API 路徑上的那一段，也是回應裡包住資料的那個鍵：/api/books 回 { books: [...] } */
export type SheetResource = "books" | "articles" | "journal";

async function fetcher<T>(url: string): Promise<Record<string, T[]>> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

/**
 * 從 Sheet 讀一張表。書籍、文章、書寫共用這一支，差別只有表名與排序。
 *
 * 解鎖權杖進 key：鎖上與解鎖是兩份不同的快取，鎖上時不會看到剛才的私人資料。
 *
 * 已經有舊資料墊著就不算「載入中」——背景重抓不該把畫面換成載入中再換回來。
 * 這個判斷原本在三支 hook 裡各寫一次，而且寫法不一樣（有的看陣列長度、有的看
 * data 在不在），於是「還在抓」與「真的沒有」在不同頁面的答案會不一致。
 */
export function useSheetRecords<T>(resource: SheetResource, sort: (rows: T[]) => T[]) {
  const { sheetId } = useSheetStore();
  const unlock = usePrivacyStore((s) => s.token);
  const key = sheetId
    ? `/api/${resource}?sheetId=${encodeURIComponent(sheetId)}${unlock ? `&unlock=${unlock}` : ""}`
    : null;

  // 先用上次存下來的資料把畫面畫出來，再於背景重新抓
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetcher<T>, {
    fallbackData: readCached<Record<string, T[]>>(key),
  });

  const rows = data?.[resource];
  const records = useMemo(() => sort(rows ?? []), [rows, sort]);

  return {
    records,
    isLoading: isLoading && records.length === 0,
    isValidating,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
