"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BookStatusMenu } from "@/features/books/components/book-status-menu";
import { BookTable } from "@/features/books/components/book-table";
import { BookViewMenu } from "@/features/reading/components/book-view-menu";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { useMounted } from "@/hooks/use-mounted";

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function BooksPage() {
  const mounted = useMounted();

  return (
    <Suspense fallback={null}>
      <ReadingHeader views={<BookViewMenu />} filters={<BookStatusMenu />} />
      <PageBody>
        {/* 表格／書封兩種檢視都在 BookTable 裡，搜尋也是它自己讀網址 */}
        {mounted && <BookTable />}
      </PageBody>
    </Suspense>
  );
}
