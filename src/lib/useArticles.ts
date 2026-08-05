import useSWR from "swr";
import { useInstapaperStore } from "@/store/useInstapaperStore";
import { InstapaperBookmark } from "@/lib/instapaper/client";
import { readCached } from "@/lib/swrCache";

export function useArticles() {
  const { token, tokenSecret } = useInstapaperStore();
  // key 用固定字串，token 只留在 fetcher 裡，才不會跟著快取寫進 localStorage
  const key = token ? "/api/instapaper/bookmarks" : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(key, async (url: string) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, tokenSecret }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "讀取失敗");
    return data as { bookmarks: InstapaperBookmark[] };
  }, { fallbackData: readCached<{ bookmarks: InstapaperBookmark[] }>(key) });

  return {
    articles: data?.bookmarks ?? [],
    isLoading,
    isValidating,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
