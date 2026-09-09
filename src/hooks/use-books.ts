"use client";

import { useCollection } from "@/hooks/use-collection";
import { Book, RecordStatus } from "@/types/book";
import { byDateThenNewest } from "@/utils/record-order";

// 想讀擺最前面：那是「接下來要看什麼」的清單，最常被翻。
// status 已由 sheets.ts 正規化過（沒填的會用日期推算），這裡直接信任它。
const STATUS_ORDER: Record<RecordStatus, number> = {
  想要: 0,
  進行: 1,
  完成: 2,
};

// 同狀態內用日期由新到舊，同一天比記錄時間；讀完的看完成日，還沒讀完的只有開始日
const byReadDate = byDateThenNewest<Book>((b) => b.endDate ?? b.startDate);

function sortBooks(books: Book[]): Book[] {
  return [...books].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || byReadDate(a, b),
  );
}

export function useBooks() {
  const { records, ...rest } = useCollection<Book>("books", sortBooks);
  return { books: records, ...rest };
}
