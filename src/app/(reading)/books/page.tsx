"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BookTable } from "@/features/books/components/book-table";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { useMounted } from "@/hooks/use-mounted";

function BooksBody() {
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <>
      <ReadingHeader current="book" />
      <PageBody>
        {/* 表格／書封兩種檢視都在 BookTable 裡，搜尋也是它自己讀網址 */}
        <BookTable />
      </PageBody>
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function BooksPage() {
  return (
    <Suspense fallback={null}>
      <BooksBody />
    </Suspense>
  );
}
