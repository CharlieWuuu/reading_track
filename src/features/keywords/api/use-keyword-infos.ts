"use client";

import useSWR, { useSWRConfig } from "swr";
import { useSheetStore } from "@/stores/useSheetStore";
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
  const { mutate: mutateGlobal } = useSWRConfig();
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

  /** 手動改一筆；改名時連帶改寫引用它的書。改完重讀，畫面才會跟著更新 */
  async function save(keyword: KeywordInfo, previousName?: string) {
    if (!sheetId) throw new Error("請先連接 Google Sheet");
    const res = await fetch("/api/keywords", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId, keyword, previousName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "儲存關鍵字失敗");
    }
    await mutate();
  }

  /** 整個關鍵字刪掉，引用它的書也一起拿掉這個字，所以書單要重讀 */
  async function remove(name: string) {
    if (!sheetId) throw new Error("請先連接 Google Sheet");
    const res = await fetch("/api/keywords", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId, name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "刪除關鍵字失敗");
    await mutate();
    await mutateGlobal(`/api/books?sheetId=${encodeURIComponent(sheetId)}`);
    return data.removed as number;
  }

  return {
    infos,
    byName,
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    enrich,
    save,
    remove,
  };
}
