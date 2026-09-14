"use client";

import useSWR from "swr";
import { KindGroup } from "@/config/record-kinds";
import { RecordRow } from "@/lib/db/queries/catalog";
import { usePrivacyStore } from "@/stores/use-privacy-store";

/** 整個 group 的紀錄。概覽頁用，書籍與文章混在同一份清單裡 */
async function fetcher(url: string): Promise<{ records: RecordRow[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

export function useGroupRecords(group: KindGroup) {
  // 解鎖了就帶權杖，不然這一頁的表格永遠看不到標私人的那幾筆
  const unlock = usePrivacyStore((s) => s.token);
  const key = `/api/groups/${group}/records${unlock ? `?unlock=${unlock}` : ""}`;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  return {
    records: data?.records ?? [],
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
