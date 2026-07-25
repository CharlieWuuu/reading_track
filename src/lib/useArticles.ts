import useSWR from "swr";
import { useInstapaperStore } from "@/store/useInstapaperStore";
import { InstapaperBookmark } from "@/lib/instapaper/client";

async function fetcher([url, token, tokenSecret]: [string, string, string]) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, tokenSecret }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data as { bookmarks: InstapaperBookmark[] };
}

export function useArticles() {
  const { token, tokenSecret } = useInstapaperStore();
  const key = token ? (["/api/instapaper/bookmarks", token, tokenSecret] as const) : null;

  const { data, error, isLoading } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    articles: data?.bookmarks ?? [],
    isLoading,
    error: error instanceof Error ? error.message : undefined,
  };
}
