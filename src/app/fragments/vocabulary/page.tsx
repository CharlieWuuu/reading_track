"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BooksGate } from "@/features/books/components/books-gate";
import { KindStatsBySlug } from "@/features/kinds/kind-stats-by-slug";
import { KindViewMenu } from "@/features/kinds/kind-view-menu";
import { VocabularySection } from "@/features/notes/components/vocabulary-section";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { useBookView } from "@/hooks/use-book-view";

/** 單字的概覽／表格／統計。單字是一個類型，跟其他類型頁同一顆選單 */
export default function VocabularyPage() {
  const view = useBookView();

  return (
    <Suspense fallback={null}>
      <ReadingHeader
        views={<KindViewMenu modes={["overview", "table", "stats"]} overviewLabel="概覽" />}
      />
      <PageBody>
        {view === "stats" ? (
          <KindStatsBySlug slug="vocabulary" />
        ) : (
          <BooksGate>
            {(books) => (
              <VocabularySection books={books} view={view === "table" ? "table" : "overview"} />
            )}
          </BooksGate>
        )}
      </PageBody>
    </Suspense>
  );
}
