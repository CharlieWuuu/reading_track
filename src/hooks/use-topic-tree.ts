"use client";

import useSWR from "swr";
import type { PrivacyFlagNode, PrivacyFlags } from "@/lib/db/queries/taxonomy";

// 跟設定頁的私人旗標同一支 API、同一個 key，SWR 共用快取
const KEY = "/api/taxonomy/privacy";

async function fetcher(url: string): Promise<PrivacyFlags> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

const EMPTY: PrivacyFlagNode[] = [];

// 領域樹：每個類型共用的那一張，次領域選單照它縮
export function useTopicTree(): PrivacyFlagNode[] {
  const { data } = useSWR(KEY, fetcher);
  return data?.types ?? EMPTY;
}
