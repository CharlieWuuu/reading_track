"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BooksGate } from "@/features/books/components/books-gate";
import { QuickAddRecordButton } from "@/features/notes/components/quick-add-record-button";
import { QuotesSection } from "@/features/notes/components/quotes-section";
import { ReadingHeader } from "@/features/reading/components/reading-header";

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function QuotesPage() {
  return (
    <Suspense fallback={null}>
      <ReadingHeader newButton={<QuickAddRecordButton kind="quotes" />} />
      <PageBody>
        <BooksGate>{(books) => <QuotesSection books={books} />}</BooksGate>
      </PageBody>
    </Suspense>
  );
}
