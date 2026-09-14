"use client";

import useSWR from "swr";
import { KindGroup } from "@/config/record-kinds";
import { Kind } from "@/lib/db/queries/kinds";

export type NewKindInput = {
  name: string;
  slug: string;
  modules: string[];
  amountUnit: string;
  labels?: Record<string, string>;
};

/**
 * 三個 group 的類型。不走 useCollection——那支綁著私人解鎖權杖與排序，
 * 類型沒有私人的問題，排序也在伺服器端就排好了。
 */

async function fetcher(url: string): Promise<{ kinds: Kind[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取類型失敗");
  return data;
}

export function useKinds() {
  const { data, error, isLoading, mutate } = useSWR("/api/kinds", fetcher);

  async function addKind(group: KindGroup, kind: NewKindInput) {
    const res = await fetch("/api/kinds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group, ...kind }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "新增類型失敗");
    await mutate();
  }

  /** 改一個類型。共用類型會在伺服器端複製成自己的，回傳的編號可能跟傳進去的不同 */
  async function editKind(kindId: string, kind: NewKindInput) {
    const res = await fetch(`/api/kinds/${kindId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kind),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "儲存類型失敗");
    await mutate();
  }

  /** 把一個類型底下的資料整批搬到另一個，來源跟著關掉 */
  async function mergeKind(kindId: string, into: string) {
    const res = await fetch(`/api/kinds/${kindId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ into }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "合併失敗");
    await mutate();
  }

  /** 關掉一個類型。底下還有資料時伺服器會擋，錯誤訊息直接丟給呼叫端顯示 */
  async function removeKind(kindId: string) {
    const res = await fetch(`/api/kinds/${kindId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "移除類型失敗");
    await mutate();
  }

  return {
    kinds: data?.kinds ?? [],
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    addKind,
    editKind,
    mergeKind,
    removeKind,
  };
}
