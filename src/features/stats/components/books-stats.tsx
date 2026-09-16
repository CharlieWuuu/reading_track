"use client";

import { useMemo } from "react";
import { DataGate } from "@/components/layout/data-gate";
import { SectionList } from "@/features/stats/components/section-list";
import { useModuleSections } from "@/features/stats/hooks/use-module-sections";
import { useBooks } from "@/hooks/use-books";
import { useRecords } from "@/hooks/use-records";

/**
 * 書籍的統計。圖表由勾了哪些模組決定，跟文章、紀事走同一支。
 *
 * Book 那個型別是舊形狀（author／type），這裡轉成欄位庫的名字再交出去。
 * 重讀靠 workId 分組、「有延伸」靠佳句數——兩個都是紀錄本來就帶著的。
 */
const BOOK_MODULES = [
  "title",
  "creator",
  "endDate",
  "amount",
  "platform",
  "language",
  "topic",
  "attribute",
] as const;

const LABELS = { creator: "作者", amount: "頁數" };

export function BooksStats() {
  const { books, isLoading, error } = useBooks();
  const { quotes } = useRecords();

  const rows = useMemo(() => {
    // 哪幾本留下了佳句。以「本」為單位：同一本記很多句也算一本
    const quoted = new Set(quotes.map((quote) => quote.bookId));
    return books.map((book) => ({
      endDate: book.endDate,
      workId: book.workId,
      title: book.title,
      creator: book.author,
      amount: book.pageCount,
      platform: book.platform,
      language: book.language,
      domain: book.domain,
      subDomain: book.subDomain,
      attribute: book.type,
      linkCount: quoted.has(book.id) ? "1" : "0",
    }));
  }, [books, quotes]);

  const sections = useModuleSections({
    moduleKeys: BOOK_MODULES,
    labels: LABELS,
    rows,
    unit: "本",
    showRepeats: true,
    showLinks: true,
  });

  return (
    <DataGate
      isLoading={isLoading}
      error={error}
      isEmpty={books.length === 0}
      emptyText="尚未新增任何書籍"
    >
      <SectionList sections={sections} />
    </DataGate>
  );
}
