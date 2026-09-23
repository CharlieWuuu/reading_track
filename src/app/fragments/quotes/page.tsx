"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BooksGate } from "@/features/books/components/books-gate";
import { KindStatsBySlug } from "@/features/kinds/kind-stats-by-slug";
import { KindViewMenu } from "@/features/kinds/kind-view-menu";
import { QuotesSection } from "@/features/notes/components/quotes-section";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { useBookView } from "@/hooks/use-book-view";
import { useKindViews } from "@/hooks/use-kind-views";

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function QuotesPage() {
  const view = useBookView();
  const views = useKindViews("fragments", "quotes");

  return (
    <Suspense fallback={null}>
      <ReadingHeader views={<KindViewMenu modes={views} />} />
      <PageBody>
        {view === "stats" ? (
          <KindStatsBySlug slug="quotes" />
        ) : (
          <BooksGate>{(books) => <QuotesSection books={books} />}</BooksGate>
        )}
      </PageBody>
    </Suspense>
  );
}
