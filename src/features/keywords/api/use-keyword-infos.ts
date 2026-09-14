"use client";

import useSWR, { useSWRConfig } from "swr";
import { KeywordInfo } from "@/types/keyword";

async function fetcher(url: string): Promise<{ keywords: KeywordInfo[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取關鍵字失敗");
  return data;
}

/** 關鍵字主檔跨三種紀錄共用，只查一次 */
export function useKeywordInfos() {
  const { mutate: mutateGlobal } = useSWRConfig();
  const key = "/api/keywords";

  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  const infos = data?.keywords ?? [];
  const byName = new Map(infos.map((info) => [info.name, info]));

  /** 手動改一筆；改名時連帶改寫引用它的書。改完重讀，畫面才會跟著更新 */
  async function save(keyword: KeywordInfo, previousName?: string) {
    const res = await fetch("/api/keywords", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, previousName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "儲存關鍵字失敗");
    }
    await mutate();
  }

  /** 整個關鍵字刪掉，引用它的書也一起拿掉這個字，所以書單要重讀 */
  async function remove(name: string) {
    const res = await fetch("/api/keywords", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "刪除關鍵字失敗");
    await mutate();
    await mutateGlobal("/api/books");
    return data.removed as number;
  }

  return {
    infos,
    byName,
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    save,
    remove,
  };
}
