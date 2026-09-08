"use client";

import { useArticles } from "@/hooks/use-articles";
import { useBooks } from "@/hooks/use-books";
import { articleItem, bookItem } from "@/utils/overview-items";
import { GroupOverview } from "./group-overview";

/**
 * 紀錄那一堆的概覽：書籍與文章混在同一份清單裡排。
 *
 * 資料還是從舊表來——新的 records 表建好了但還沒搬。搬完之後這裡改成讀
 * 一支 hook 就好，版面不用動。
 */
export function RecordsOverview() {
  const { books } = useBooks();
  const { articles } = useArticles();

  const active = books.filter((b) => b.status === "閱讀中").map(bookItem);
  const pending = books.filter((b) => b.status === "想讀").map(bookItem);
  const done = [
    ...books.filter((b) => b.status === "已讀完").map(bookItem),
    ...articles.filter((a) => a.endDate).map(articleItem),
  ].sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? ""));

  return (
    <GroupOverview
      active={active}
      pending={pending}
      done={done}
      headlineLabel="在讀 · 最近開始的一本"
      activeLabel="其餘在讀"
      pendingLabel="想讀"
    />
  );
}
