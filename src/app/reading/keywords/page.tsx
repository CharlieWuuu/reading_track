"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BooksGate } from "@/features/books/components/books-gate";
import { KeywordViewMenu } from "@/features/keywords/components/keyword-view-menu";
import { KeywordsSection } from "@/features/keywords/components/keywords-section";
import { ReadingHeader } from "@/features/reading/components/reading-header";

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function KeywordsPage() {
  return (
    <Suspense fallback={null}>
      <ReadingHeader views={<KeywordViewMenu />} />
      <PageBody>
        <BooksGate>{(books) => <KeywordsSection books={books} showSwitch={false} />}</BooksGate>
      </PageBody>
    </Suspense>
  );
}
