"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BookStatusMenu } from "@/features/books/components/book-status-menu";
import { BookTable } from "@/features/books/components/book-table";
import { BookViewMenu } from "@/features/reading/components/book-view-menu";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { useBooks } from "@/hooks/use-books";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { isBookViewMode, useBookViewStore } from "@/stores/use-book-view-store";

/** 頁首那行小字：312 本 · 在讀 3 · 今年完成 61 */
function bookMeta(books: { status: string; endDate: string | null }[]): string {
  const thisYear = new Date().getFullYear();
  const reading = books.filter((b) => b.status === "閱讀中").length;
  const doneThisYear = books.filter(
    (b) => b.endDate && Number(b.endDate.slice(0, 4)) === thisYear,
  ).length;
  return `${books.length} 本 · 在讀 ${reading} · 今年完成 ${doneThisYear}`;
}

function BooksPageBody() {
  const mounted = useMounted();
  const { searchParams } = useUrlParams();
  const { view: savedView } = useBookViewStore();
  const urlView = searchParams.get("view");
  const view = isBookViewMode(urlView) ? urlView : savedView;

  return (
    // 概覽自己開兩欄各自的捲動條（月份格線＋窄欄），其餘檢視照舊交給 PageBody
    <PageBody scroll={view !== "overview"}>
      {/* 表格／書封兩種檢視都在 BookTable 裡，搜尋也是它自己讀網址 */}
      {mounted && <BookTable />}
    </PageBody>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function BooksPage() {
  const { books } = useBooks();

  return (
    <Suspense fallback={null}>
      <ReadingHeader
        views={<BookViewMenu />}
        filters={<BookStatusMenu />}
        meta={books.length > 0 ? bookMeta(books) : undefined}
      />
      <BooksPageBody />
    </Suspense>
  );
}
