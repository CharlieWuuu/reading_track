"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BooksGate } from "@/features/books/components/books-gate";
import { QuickAddRecordButton } from "@/features/notes/components/quick-add-record-button";
import { VocabularySection } from "@/features/notes/components/vocabulary-section";
import { ReadingHeader } from "@/features/reading/components/reading-header";

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function VocabularyPage() {
  return (
    <Suspense fallback={null}>
      <ReadingHeader newButton={<QuickAddRecordButton kind="vocabulary" />} />
      <PageBody>
        <BooksGate>{(books) => <VocabularySection books={books} />}</BooksGate>
      </PageBody>
    </Suspense>
  );
}
