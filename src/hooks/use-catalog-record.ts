"use client";

import useSWR from "swr";
import { usePrivacyStore } from "@/stores/use-privacy-store";

/**
 * 單筆的值。表單認的是欄位不是資料表，所以拿到的是攤平過的一份。
 *
 * linkId 是站內關聯掛在哪個 id 上：紀錄掛在作品（同一本書讀兩次，連到它的
 * 佳句與心得是同一批），片段與書寫沒有作品層，就掛自己身上。
 */
type Loaded = { kindId: string; linkId: string; values: Record<string, string> };

async function fetcher(url: string): Promise<Loaded> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

export function useCatalogRecord(id: string) {
  // 標私人的那幾筆鎖著時伺服器會當作不存在，解鎖了就要帶權杖
  const unlock = usePrivacyStore((s) => s.token);
  const key = `/api/catalog/${id}${unlock ? `?unlock=${unlock}` : ""}`;
  const { data, error, isLoading } = useSWR(key, fetcher);

  return {
    record: data,
    isLoading,
    error: error instanceof Error ? error.message : undefined,
  };
}
