"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { readCached } from "@/lib/swr-cache";
import { usePrivacyStore } from "@/stores/use-privacy-store";

/** API 路徑上的那一段，也是回應裡包住資料的那個鍵：/api/books 回 { books: [...] } */
export type CollectionName = "books" | "articles" | "writings";

async function fetcher<T>(url: string): Promise<Record<string, T[]>> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

/**
 * 讀一份清單。書籍、文章、書寫共用這一支，差別只有名字與排序。
 *
 * 解鎖權杖進 key：鎖上與解鎖是兩份不同的快取，鎖上時不會看到剛才的私人資料。
 *
 * 已經有舊資料墊著就不算「載入中」——背景重抓不該把畫面換成載入中再換回來。
 * 這個判斷原本在三支 hook 裡各寫一次，而且寫法不一樣（有的看陣列長度、有的看
 * data 在不在），於是「還在抓」與「真的沒有」在不同頁面的答案會不一致。
 */
export function useCollection<T>(resource: CollectionName, sort: (rows: T[]) => T[]) {
  const unlock = usePrivacyStore((s) => s.token);
  const key = `/api/${resource}${unlock ? `?unlock=${unlock}` : ""}`;

  // 先用上次存下來的資料把畫面畫出來，再於背景重新抓
  // 綁在 key 上：readCached 是在 render 當中被呼叫的，每次都重讀一次舊快取
  const fallbackData = useMemo(() => readCached<Record<string, T[]>>(key), [key]);

  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetcher<T>, {
    fallbackData,
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
