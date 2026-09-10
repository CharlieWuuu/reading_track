"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { usePrivacyStore } from "@/stores/use-privacy-store";
import { QuoteRow, VocabularyRow } from "@/types/record";

/**
 * 佳句／單字概覽頁專用：分頁抓，滾到底載入下一批。
 *
 * 跟 useRecords 分開：那支給書籍表單裡的 RecordLinkPicker、編輯頁用，
 * 那幾個場景要整包資料才能搜尋、連結——這支只服務概覽頁的卡片牆。
 *
 * 佳句、單字都沒有「進行中」這個狀態，記下就算數，跟書寫同一種情況——
 * 不像書籍/文章分 active/pending/done，這裡整批都是 done，直接分頁。
 */

type Paged<T> = { rows: T[]; nextCursor: string | null; hasMore: boolean; total: number };

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

const PAGE_SIZE = 30;

function usePagedFragments<T>(kind: "quotes" | "vocabulary") {
  const unlock = usePrivacyStore((s) => s.token);
  const unlockQuery = unlock ? `&unlock=${unlock}` : "";

  const getKey = (pageIndex: number, previousPage: Paged<T> | null) => {
    if (previousPage && !previousPage.hasMore) return null;
    const cursor = previousPage?.nextCursor;
    if (pageIndex > 0 && !cursor) return null;
    return `/api/records?scope=done&kind=${kind}&limit=${PAGE_SIZE}${unlockQuery}${
      cursor ? `&cursor=${cursor}` : ""
    }`;
  };

  const {
    data: pages,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
  } = useSWRInfinite<Paged<T>>(getKey, fetcher);

  const rows = useMemo(() => (pages ?? []).flatMap((page) => page.rows), [pages]);
  const total = pages?.[0]?.total ?? 0;
  const hasMore = pages?.at(-1)?.hasMore ?? true;
  const isLoadingMore = isValidating && size > 0 && pages !== undefined;

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setSize(size + 1);
  }, [isLoadingMore, setSize, size]);

  return {
    rows,
    total,
    isLoading: isLoading && rows.length === 0,
    isLoadingMore,
    hasMore: pages !== undefined && hasMore,
    loadMore,
    error: error instanceof Error ? error.message : undefined,
  };
}

export function useQuotesOverview() {
  return usePagedFragments<QuoteRow>("quotes");
}

export function useVocabularyOverview() {
  return usePagedFragments<VocabularyRow>("vocabulary");
}
