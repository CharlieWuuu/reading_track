"use client";

import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { Article } from "@/types/article";
import { articleItem } from "@/utils/overview-items";

/**
 * 文章概覽：跟書籍共用同一套版面（GroupOverview），只是餵的資料不同。
 *
 * 文章沒有「開始日期」，讀不讀是一翻兩瞪眼，沒有「進行中」這個中間狀態——
 * 所以沒有頭條，直接照完成月份排、待讀的收進右欄。
 */
export function ArticlesOverview({ articles }: { articles: Article[] }) {
  const pending = articles.filter((a) => !a.endDate).map(articleItem);
  const done = articles.filter((a) => a.endDate).map(articleItem);

  return (
    <GroupOverview
      active={[]}
      pending={pending}
      done={done}
      headlineLabel=""
      activeLabel="讀到一半"
      pendingLabel="待讀"
      coverSize="sm"
    />
  );
}
