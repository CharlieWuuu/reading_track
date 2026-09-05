"use client";

import { useCollection } from "@/hooks/use-collection";
import { Article } from "@/types/article";

/** 只有一個日期，直接由新到舊；沒填日期的排最後，那是還沒讀完的 */
function sortArticles(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    const aDate = a.endDate ?? "";
    const bDate = b.endDate ?? "";
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return a.title.localeCompare(b.title, "zh-Hant");
  });
}

export function useArticles() {
  const { records, ...rest } = useCollection<Article>("articles", sortArticles);
  return { articles: records, ...rest };
}
