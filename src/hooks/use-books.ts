"use client";

import { useCollection } from "@/hooks/use-collection";
import { Book, ReadingStatus } from "@/types/book";

// 想讀擺最前面：那是「接下來要看什麼」的清單，最常被翻。
// status 已由 sheets.ts 正規化過（沒填的會用日期推算），這裡直接信任它。
const STATUS_ORDER: Record<ReadingStatus, number> = {
  想讀: 0,
  閱讀中: 1,
  已讀完: 2,
};

function sortBooks(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    // 同狀態內用日期由新到舊；沒日期的排後面
    const aDate = a.endDate ?? a.startDate ?? "";
    const bDate = b.endDate ?? b.startDate ?? "";
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return a.title.localeCompare(b.title, "zh-Hant");
  });
}

export function useBooks() {
  const { records, ...rest } = useCollection<Book>("books", sortBooks);
  return { books: records, ...rest };
}
