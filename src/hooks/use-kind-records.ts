"use client";

import useSWR from "swr";
import { RecordRow } from "@/lib/db/queries/catalog";

/** 某一種類型底下的紀錄。舊的 books／articles 還走各自的 hook，兩套並存 */
async function fetcher(url: string): Promise<{ records: RecordRow[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

export function useKindRecords(kindId: string) {
  const { data, error, isLoading, mutate } = useSWR(`/api/kinds/${kindId}/records`, fetcher);

  return {
    records: data?.records ?? [],
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
