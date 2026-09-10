"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { PagedArticles } from "@/lib/db/queries/articles";
import { usePrivacyStore } from "@/stores/use-privacy-store";
import { Article } from "@/types/article";

/**
 * 文章概覽頁專用：待讀整批抓，讀完的分頁抓。
 *
 * 跟 useArticles 分開：那支給表格/卡片檢視、搜尋用，這幾個場景都要「全部資料」，
 * 不能套分頁——這支只服務概覽頁沒有搜尋條件時的卡片牆。
 */

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

const DONE_PAGE_SIZE = 30;

export function useArticlesOverview() {
  const unlock = usePrivacyStore((s) => s.token);
  const unlockQuery = unlock ? `&unlock=${unlock}` : "";

  const pendingKey = `/api/articles?scope=pending${unlockQuery}`;
  const {
    data: pendingData,
    error: pendingError,
    isLoading: pendingLoading,
  } = useSWR<{ articles: Article[] }>(pendingKey, fetcher);

  const getDoneKey = (pageIndex: number, previousPage: PagedArticles | null) => {
    if (previousPage && !previousPage.hasMore) return null;
    const cursor = previousPage?.nextCursor;
    if (pageIndex > 0 && !cursor) return null;
    return `/api/articles?scope=done&limit=${DONE_PAGE_SIZE}${unlockQuery}${
      cursor ? `&cursor=${cursor}` : ""
    }`;
  };

  const {
    data: donePages,
    error: doneError,
    isLoading: doneLoading,
    isValidating: doneValidating,
    size,
    setSize,
  } = useSWRInfinite<PagedArticles>(getDoneKey, fetcher);

  const done = useMemo(() => (donePages ?? []).flatMap((page) => page.rows), [donePages]);
  const total = donePages?.[0]?.total ?? 0;
  const hasMore = donePages?.at(-1)?.hasMore ?? true;
  const isLoadingMore = doneValidating && size > 0 && donePages !== undefined;

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setSize(size + 1);
  }, [isLoadingMore, setSize, size]);

  return {
    pending: pendingData?.articles ?? [],
    done,
    doneTotal: total,
    isLoading: pendingLoading || (doneLoading && done.length === 0),
    isLoadingMore,
    hasMore: donePages !== undefined && hasMore,
    loadMore,
    error:
      pendingError instanceof Error
        ? pendingError.message
        : doneError instanceof Error
          ? doneError.message
          : undefined,
  };
}
