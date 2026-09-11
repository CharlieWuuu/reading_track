"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BookEditModeButton } from "@/features/books/components/book-edit-mode-button";
import { BookStatusMenu } from "@/features/books/components/book-status-menu";
import { BookTable } from "@/features/books/components/book-table";
import { BookViewMenu } from "@/features/reading/components/book-view-menu";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { useBookView } from "@/hooks/use-book-view";
import { useFilteredBooks } from "@/hooks/use-filtered-books";
import { useMounted } from "@/hooks/use-mounted";
import { Book } from "@/types/book";
import { rootId } from "@/utils/book-reads";

/**
 * 頁首那行小字：133 次・128 本——「次」含重讀，「本」是不重複的作品數。
 * 兩個數字一樣就不用重複講兩次，只寫「128 本」。
 *
 * 跟著目前的篩選走：選了「進行」就只算進行中的那幾本，不是書單的全部。
 */
function bookMeta(books: Book[]): string {
  const titles = new Set(books.map(rootId));
  return books.length === titles.size
    ? `${titles.size} 本`
    : `${books.length} 次・${titles.size} 本`;
}

function BooksPageBody() {
  const mounted = useMounted();
  const view = useBookView();

  return (
    // 概覽自己開兩欄各自的捲動條（月份格線＋窄欄），其餘檢視照舊交給 PageBody
    <PageBody scroll={view !== "overview"}>
      {/* 表格／書封兩種檢視都在 BookTable 裡，搜尋也是它自己讀網址 */}
      {mounted && <BookTable />}
    </PageBody>
  );
}

/** 頁首篩選：概覽頁本來就把在讀／想讀／讀完攤在同一頁，狀態篩選對它不生效，
 * 顯示出來卻點了沒反應會讓人以為壞掉，乾脆不給點 */
function BooksHeaderFilters() {
  const view = useBookView();
  if (view === "overview") return null;
  return <BookStatusMenu />;
}

/** 編輯模式只有表格檢視能一次改多列，書封／概覽點了沒反應，一樣不給看 */
function BooksHeaderBeforeViews() {
  const view = useBookView();
  if (view !== "table") return null;
  return <BookEditModeButton />;
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function BooksPage() {
  const { books } = useFilteredBooks();

  return (
    <Suspense fallback={null}>
      <ReadingHeader
        beforeViews={<BooksHeaderBeforeViews />}
        views={<BookViewMenu />}
        filters={<BooksHeaderFilters />}
        meta={books.length > 0 ? bookMeta(books) : undefined}
      />
      <BooksPageBody />
    </Suspense>
  );
}
