"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BookStatusMenu } from "@/features/books/components/book-status-menu";
import { BookTable } from "@/features/books/components/book-table";
import { BookViewMenu } from "@/features/reading/components/book-view-menu";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { isBookViewMode, useBookViewStore } from "@/stores/use-book-view-store";

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
  return (
    <Suspense fallback={null}>
      <ReadingHeader views={<BookViewMenu />} filters={<BookStatusMenu />} />
      <BooksPageBody />
    </Suspense>
  );
}
