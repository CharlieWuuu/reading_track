"use client";

import useSWR from "swr";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { usePrivacyStore } from "@/stores/use-privacy-store";

/**
 * 某一種類型底下的全部。紀錄那個 group 回 records，片段與書寫回 fragments——
 * 兩張表形狀不同，呼叫端自己看拿到哪一種。舊的 books／articles 還走各自的 hook。
 */
async function fetcher(url: string): Promise<{ records?: RecordRow[]; fragments?: FragmentRow[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

/** kindId 給空的就不發請求——呼叫端用它表示「這個情境不需要」（例如編輯頁不要重讀建議） */
export function useKindRecords(kindId: string) {
  // 這個 group 裡也有標私人的紀錄，解鎖了就要帶權杖，不然解了還是看不到
  const unlock = usePrivacyStore((s) => s.token);
  const key = kindId ? `/api/kinds/${kindId}/records${unlock ? `?unlock=${unlock}` : ""}` : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  return {
    records: data?.records ?? [],
    fragments: data?.fragments ?? [],
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
