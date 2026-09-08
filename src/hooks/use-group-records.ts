"use client";

import useSWR from "swr";
import { KindGroup } from "@/config/record-kinds";
import { RecordRow } from "@/lib/db/queries/catalog";

/** 整堆的紀錄。概覽頁用，書籍與文章混在同一份清單裡 */
async function fetcher(url: string): Promise<{ records: RecordRow[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

export function useGroupRecords(group: KindGroup) {
  const { data, error, isLoading, mutate } = useSWR(`/api/groups/${group}/records`, fetcher);

  return {
    records: data?.records ?? [],
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
