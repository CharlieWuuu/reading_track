"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { PagedWritings } from "@/lib/db/queries/writings";

/**
 * 書寫概覽頁專用：分頁抓，滾到底載入下一批。
 *
 * 跟 useWritings 分開：那支給表格檢視、搜尋、topic 篩選用，這幾個場景要整包
 * 資料才能在前端 filter——這支只服務概覽頁沒有篩選條件時的卡片牆。
 */

async function fetcher(url: string): Promise<PagedWritings> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

const PAGE_SIZE = 30;

export function useWritingsOverview() {
  const getKey = (pageIndex: number, previousPage: PagedWritings | null) => {
    if (previousPage && !previousPage.hasMore) return null;
    const cursor = previousPage?.nextCursor;
    if (pageIndex > 0 && !cursor) return null;
    return `/api/writings?scope=done&limit=${PAGE_SIZE}${cursor ? `&cursor=${cursor}` : ""}`;
  };

  const {
    data: pages,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
  } = useSWRInfinite(getKey, fetcher);

  const rows = useMemo(() => (pages ?? []).flatMap((page) => page.rows), [pages]);
  const total = pages?.[0]?.total ?? 0;
  const hasMore = pages?.at(-1)?.hasMore ?? true;
  const isLoadingMore = isValidating && size > 0 && pages !== undefined;

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setSize(size + 1);
  }, [isLoadingMore, setSize, size]);

  return {
    writings: rows,
    total,
    isLoading: isLoading && rows.length === 0,
    isLoadingMore,
    hasMore: pages !== undefined && hasMore,
    loadMore,
    error: error instanceof Error ? error.message : undefined,
  };
}
