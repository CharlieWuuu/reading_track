"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { KindGroup } from "@/config/record-kinds";
import { PagedRecordRows, RecordRow } from "@/lib/db/queries/catalog";
import { usePrivacyStore } from "@/stores/use-privacy-store";

/**
 * 紀錄概覽頁專用：進行中／想要整批抓，完成的分頁抓（滾到底載入下一批）。
 *
 * 跟 useGroupRecords 分開：那支給表格檢視、儀表板、日報/週報/年報用，這幾個
 * 場景都要「全部資料」，不能套分頁——這支只服務概覽頁的卡片牆。
 */

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

const DONE_PAGE_SIZE = 30;

export function useGroupRecordsOverview(group: KindGroup) {
  const unlock = usePrivacyStore((s) => s.token);
  const unlockQuery = unlock ? `&unlock=${unlock}` : "";

  const activeKey = `/api/groups/${group}/records?scope=active${unlockQuery}`;
  const {
    data: activeData,
    error: activeError,
    isLoading: activeLoading,
  } = useSWR<{ records: RecordRow[] }>(activeKey, fetcher);

  const getDoneKey = (pageIndex: number, previousPage: PagedRecordRows | null) => {
    if (previousPage && !previousPage.hasMore) return null;
    const cursor = previousPage?.nextCursor;
    if (pageIndex > 0 && !cursor) return null;
    return `/api/groups/${group}/records?scope=done&limit=${DONE_PAGE_SIZE}${unlockQuery}${
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
  } = useSWRInfinite<PagedRecordRows>(getDoneKey, fetcher);

  const done = useMemo(() => (donePages ?? []).flatMap((page) => page.rows), [donePages]);
  const total = donePages?.[0]?.total ?? 0;
  const lastPage = donePages?.at(-1);
  const hasMore = lastPage?.hasMore ?? true;
  // 正在抓下一批的時候不能再觸發——sentinel 在新資料回來、把它推開之前都還在
  // 可視範圍內，IntersectionObserver 會一直回報「交叉中」，不擋住的話會在
  // 同一批還沒回來時又追加好幾次 setSize，跟 SWRInfinite 內部狀態對不上
  const isLoadingMore = doneValidating && size > 0 && donePages !== undefined;

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setSize(size + 1);
  }, [isLoadingMore, setSize, size]);

  return {
    active: activeData?.records ?? [],
    done,
    doneTotal: total,
    isLoading: activeLoading || (doneLoading && done.length === 0),
    isLoadingMore,
    hasMore: donePages !== undefined && hasMore,
    loadMore,
    error:
      activeError instanceof Error
        ? activeError.message
        : doneError instanceof Error
          ? doneError.message
          : undefined,
  };
}
