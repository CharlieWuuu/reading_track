"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BooksGate } from "@/features/books/components/books-gate";
import { KeywordsSection } from "@/features/keywords/components/keywords-section";
import { ReadingHeader } from "@/features/reading/components/reading-header";

/**
 * 閱讀底下的關鍵字只有卡片：這一頁是拿來翻的。
 * 圖表、地圖、年代搬到統計了（`/stats/keywords`）。
 */
export default function KeywordsPage() {
  return (
    <Suspense fallback={null}>
      <ReadingHeader />
      <PageBody>
        <BooksGate>{(books) => <KeywordsSection books={books} view="card" />}</BooksGate>
      </PageBody>
    </Suspense>
  );
}
