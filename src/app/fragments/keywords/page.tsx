"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BooksGate } from "@/features/books/components/books-gate";
import { KeywordsSection } from "@/features/keywords/components/keywords-section";
import { KindStatsBySlug } from "@/features/kinds/kind-stats-by-slug";
import { KindViewMenu } from "@/features/kinds/kind-view-menu";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { useBookView } from "@/hooks/use-book-view";

/**
 * 卡片牆是拿來翻的；圖表、地圖、年代在統計那一種檢視裡。
 * 地圖與年代讀的是關鍵字自己的座標與起訖年，不綁書。
 */
export default function KeywordsPage() {
  const view = useBookView();

  return (
    <Suspense fallback={null}>
      <ReadingHeader views={<KindViewMenu />} />
      <PageBody>
        {view === "stats" ? (
          <KindStatsBySlug slug="keywords" />
        ) : (
          <BooksGate>{(books) => <KeywordsSection books={books} />}</BooksGate>
        )}
      </PageBody>
    </Suspense>
  );
}
