"use client";

import { DataGate } from "@/components/layout/data-gate";
import { SectionList } from "@/features/stats/components/section-list";
import { useBookSections } from "@/features/stats/hooks/use-book-sections";
import { useBooks } from "@/hooks/use-books";
import { useRecords } from "@/hooks/use-records";

export function BooksStats() {
  const { books, isLoading, error } = useBooks();
  const { quotes } = useRecords();
  const sections = useBookSections(books, quotes);

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
