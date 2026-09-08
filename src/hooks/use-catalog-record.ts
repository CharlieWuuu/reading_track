"use client";

import useSWR from "swr";

/** 單筆的值。表單認的是欄位不是資料表，所以拿到的是攤平過的一份 */
type Loaded = { kindId: string; values: Record<string, string> };

async function fetcher(url: string): Promise<Loaded> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

export function useCatalogRecord(id: string) {
  const { data, error, isLoading } = useSWR(`/api/catalog/${id}`, fetcher);

  return {
    record: data,
    isLoading,
    error: error instanceof Error ? error.message : undefined,
  };
}
