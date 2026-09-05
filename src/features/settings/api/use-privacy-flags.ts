"use client";

import useSWR from "swr";
import type { PrivacyFlags } from "@/lib/db/queries/taxonomy";

const KEY = "/api/taxonomy/privacy";

async function fetcher(url: string): Promise<PrivacyFlags> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

const EMPTY: PrivacyFlags = { types: [], writingTypes: [] };

/**
 * 私人旗標的讀寫。
 *
 * 切換後重讀整份，不在前端自己改狀態——這份清單是「藏或不藏」的唯一來源，
 * 前端猜錯的代價是使用者以為藏起來了其實沒有。
 */
export function usePrivacyFlags() {
  const { data, error, isLoading, mutate } = useSWR(KEY, fetcher);

  async function toggle(
    target: "type" | "writingType",
    id: string,
    isPrivate: boolean,
  ): Promise<void> {
    const res = await fetch(KEY, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, id, isPrivate }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "寫入失敗");
    }
    await mutate();
  }

  return {
    flags: data ?? EMPTY,
    isLoading: isLoading && !data,
    error: error instanceof Error ? error.message : undefined,
    toggle,
  };
}
