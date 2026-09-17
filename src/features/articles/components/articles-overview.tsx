"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { useArticlesOverview } from "@/hooks/use-articles-overview";
import { articleItem } from "@/utils/overview-items";

/**
 * 文章概覽：跟書籍共用同一套版面（GroupOverview），只是餵的資料不同。
 *
 * 文章沒有「開始日期」，讀不讀是一翻兩瞪眼，沒有「進行中」這個中間狀態——
 * 所以沒有頭條，直接照完成月份排、待讀的收進右欄。
 *
 */
export function ArticlesOverview() {
  const overview = useArticlesOverview();

  if (overview.isLoading) return <PageLoading />;

  const pending = overview.pending.map(articleItem);
  const done = overview.done.map(articleItem);

  return (
    <GroupOverview
      active={[]}
      pending={pending}
      done={done}
      doneTotal={overview.doneTotal}
      headlineLabel=""
      unit="篇"
      onLoadMore={overview.loadMore}
      hasMore={overview.hasMore}
      isLoadingMore={overview.isLoadingMore}
    />
  );
}
