"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { SectionList } from "@/features/stats/components/section-list";
import { useBookSections } from "@/features/stats/hooks/use-book-sections";
import { useBooks } from "@/hooks/use-books";
import { useMounted } from "@/hooks/use-mounted";
import { useRecords } from "@/hooks/use-records";
import { useSheetStore } from "@/stores/use-sheet-store";

export function BooksStats() {
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { books, isLoading, error } = useBooks();
  const { quotes } = useRecords();
  const sections = useBookSections(books, quotes);

  if (!mounted) return null;

  if (!sheetId) {
    return <PageMessage>請先到「設定」頁面連接 Google Sheet</PageMessage>;
  }

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageMessage tone="error">{error}</PageMessage>;
  }

  if (books.length === 0) {
    return <PageMessage>尚未新增任何書籍</PageMessage>;
  }

  return <SectionList sections={sections} />;
}
