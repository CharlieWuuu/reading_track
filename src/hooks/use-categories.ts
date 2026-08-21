"use client";

import { useMemo } from "react";
import { useArticles } from "@/hooks/use-articles";
import { useBooks } from "@/hooks/use-books";
import { useWritings } from "@/hooks/use-writings";
import {
  BookCategories,
  CATEGORY_FIELDS,
  DEFAULT_CATEGORIES,
  fieldValue,
  splitTags,
  type CategorySource,
} from "@/types/book";

/**
 * 分類選項一律從資料 group 出來，不再另外維護一張「選項」表。
 *
 * 那張表是整份試算表裡唯一「不是紀錄」的東西，得記得維護，還會留著早就不用的值。
 * 而它真正的作用（先登記一個還沒用過的選項）在表單裡直接打字就能做到——
 * 打錯字會出現在選單裡，直到那筆紀錄被改掉，這個代價比維護一份清單小。
 */
export function useCategories() {
  const { books } = useBooks();
  const { articles } = useArticles();
  const { writings } = useWritings();

  const counts = useMemo(() => {
    const records: Record<CategorySource, object[]> = {
      book: books,
      article: articles,
      writings: writings,
    };

    const result = {} as Record<keyof BookCategories, Map<string, number>>;
    for (const key of Object.keys(CATEGORY_FIELDS) as (keyof BookCategories)[]) {
      const { field, sources } = CATEGORY_FIELDS[key];
      const map = new Map<string, number>();
      for (const source of sources) {
        for (const item of records[source]) {
          // 屬性一格可以放多個，領域雖然是單選，舊資料仍可能是頓號串起來的
          for (const value of splitTags(fieldValue(item, field))) {
            map.set(value, (map.get(value) ?? 0) + 1);
          }
        }
      }
      result[key] = map;
    }
    return result;
  }, [books, articles, writings]);

  /** 用得多的排前面，同樣多才照筆畫——選單最上面就是你最常用的那幾個 */
  const categories = useMemo(() => {
    const result = { ...DEFAULT_CATEGORIES };
    for (const key of Object.keys(counts) as (keyof BookCategories)[]) {
      result[key] = [...counts[key].entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hant"))
        .map(([value]) => value);
    }
    return result;
  }, [counts]);

  return { categories, counts };
}
