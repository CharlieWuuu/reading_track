"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BookTable } from "@/features/books/components/book-table";
import { KindStatsBySlug } from "@/features/kinds/kind-stats-by-slug";
import { KindViewMenu } from "@/features/kinds/kind-view-menu";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { useBookView } from "@/hooks/use-book-view";
import { useFilteredBooks } from "@/hooks/use-filtered-books";
import { useKindViews } from "@/hooks/use-kind-views";
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
    <PageBody>
      {/* 表格／書封兩種檢視都在 BookTable 裡，搜尋也是它自己讀網址 */}
      {mounted && (view === "stats" ? <KindStatsBySlug slug="books" /> : <BookTable />)}
    </PageBody>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function BooksPage() {
  const { books } = useFilteredBooks();
  const views = useKindViews("records", "books"); // 有哪幾種看法由類型自己說，不寫在這一頁

  return (
    <Suspense fallback={null}>
      <ReadingHeader
        views={<KindViewMenu modes={views} cardLabel="書封" />}
        meta={books.length > 0 ? bookMeta(books) : undefined}
      />
      <BooksPageBody />
    </Suspense>
  );
}
