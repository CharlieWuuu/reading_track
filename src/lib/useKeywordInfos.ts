"use client";

import useSWR from "swr";
import { useSheetStore } from "@/store/useSheetStore";
import { KeywordInfo } from "@/types/keyword";

async function fetcher(url: string): Promise<{ keywords: KeywordInfo[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取關鍵字失敗");
  return data;
}

export type EnrichResult = { added: number; found: number; remaining: number };

/** 關鍵字主檔存在試算表的「關鍵字」工作表，跨書共用、只查一次 */
export function useKeywordInfos() {
  const { sheetId } = useSheetStore();
  const key = sheetId ? `/api/keywords?sheetId=${encodeURIComponent(sheetId)}` : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  const infos = data?.keywords ?? [];
  const byName = new Map(infos.map((info) => [info.name, info]));

  /** 把還沒查過的名字送去查維基，回報補了幾個；retry 連查過但沒查到的也再試一次 */
  async function enrich(names: string[], retry = false): Promise<EnrichResult> {
    if (!sheetId) throw new Error("請先連接 Google Sheet");
    const res = await fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId, names, retry }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error ?? "補齊關鍵字失敗");
    await mutate();
    return result as EnrichResult;
  }

  /** 手動改一筆；改完重讀主檔，畫面才會跟著更新 */
  async function save(keyword: KeywordInfo) {
    if (!sheetId) throw new Error("請先連接 Google Sheet");
    const res = await fetch("/api/keywords", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId, keyword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "儲存關鍵字失敗");
    }
    await mutate();
  }

  return {
    infos,
    byName,
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    enrich,
    save,
  };
}
