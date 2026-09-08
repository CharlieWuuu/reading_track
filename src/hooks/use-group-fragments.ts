"use client";

import useSWR from "swr";
import { KindGroup } from "@/config/record-kinds";
import { FragmentRow } from "@/lib/db/queries/catalog";

/** 片段與專欄共用：兩者同一張表，只差類型屬於哪一堆 */
async function fetcher(url: string): Promise<{ fragments: FragmentRow[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

export function useGroupFragments(group: KindGroup) {
  const { data, error, isLoading, mutate } = useSWR(`/api/groups/${group}/fragments`, fetcher);

  return {
    fragments: data?.fragments ?? [],
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
