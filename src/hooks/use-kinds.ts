"use client";

import useSWR from "swr";
import { KindGroup } from "@/config/record-kinds";
import { Kind } from "@/lib/db/queries/kinds";

export type NewKindInput = { name: string; modules: string[]; amountUnit: string };

/**
 * 三堆的類型。不走 useCollection——那支綁著私人解鎖權杖與排序，
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

  return {
    kinds: data?.kinds ?? [],
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    addKind,
  };
}
