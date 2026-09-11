"use client";

import useSWR from "swr";
import type { Linkable } from "@/types/record";

async function fetcher(url: string): Promise<Linkable[]> {
  const res = await fetch(url);
  const data = (await res.json()) as { items: Linkable[] };
  return data.items;
}

/** 某筆內容的站內關聯：讀取目前連了誰、整批換掉連結清單 */
export function useContentLinks(id: string | null) {
  const { data, isLoading, mutate } = useSWR(id ? `/api/links/${id}` : null, fetcher);
  const linked = data ?? [];

  async function setAll(items: Linkable[]): Promise<void> {
    if (!id) return;
    await mutate(items, false);
    await fetch(`/api/links/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherIds: items.map((item) => item.id) }),
    });
    await mutate();
  }

  return {
    linked,
    loading: isLoading && !data,
    link: (item: Linkable) => setAll([...linked, item]),
    unlink: (itemId: string) => setAll(linked.filter((item) => item.id !== itemId)),
  };
}

/** 跨作品／片段／書寫模糊搜尋，tag input 打字時用 */
export async function searchContentLinks(query: string, excludeId?: string): Promise<Linkable[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ q: query });
  if (excludeId) params.set("exclude", excludeId);
  const res = await fetch(`/api/links/search?${params}`);
  const data = (await res.json()) as { items: Linkable[] };
  return data.items;
}
