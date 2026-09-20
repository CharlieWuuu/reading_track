"use client";

import useSWR from "swr";
import { KindGroup } from "@/config/record-kinds";
import { FragmentRow } from "@/lib/db/queries/catalog";
import { usePrivacyStore } from "@/stores/use-privacy-store";

/** 片段與書寫共用：兩者同一張表，只差類型屬於哪個 group */
async function fetcher(url: string): Promise<{ fragments: FragmentRow[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

/**
 * 這個 group 底下的片段。
 *
 * 紀錄那個 group 不查：它的資料在 domain_works/records，那支 API 只服務
 * fragments 與 writings，帶 records 進去一律回 400「沒有這個 group」。
 * 概覽頁三個 group 共用同一支元件，所以這裡要自己擋——每次進紀錄頁
 * 都發一個注定失敗的請求，console 一直紅，真的壞掉時反而看不出來。
 */
export function useGroupFragments(group: KindGroup) {
  const unlock = usePrivacyStore((s) => s.token);
  const key =
    group === "records"
      ? null
      : `/api/groups/${group}/fragments${unlock ? `?unlock=${unlock}` : ""}`;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  return {
    fragments: data?.fragments ?? [],
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
