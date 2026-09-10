"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BooksGate } from "@/features/books/components/books-gate";
import { QuickAddRecordButton } from "@/features/notes/components/quick-add-record-button";
import { VocabularyLanguageMenu } from "@/features/notes/components/vocabulary-language-menu";
import { VocabularySection } from "@/features/notes/components/vocabulary-section";
import { GroupViewMenu } from "@/features/overview/components/group-view-menu";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { useUrlParams } from "@/hooks/use-url-param";
import { isGroupViewMode, useGroupViewStore } from "@/stores/use-group-view-store";

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function VocabularyPage() {
  const { searchParams } = useUrlParams();
  const { view: savedView } = useGroupViewStore();
  const urlView = searchParams.get("view");
  const view = isGroupViewMode(urlView) ? urlView : savedView;

  return (
    <Suspense fallback={null}>
      <ReadingHeader
        views={<GroupViewMenu />}
        filters={<VocabularyLanguageMenu />}
        newButton={<QuickAddRecordButton kind="vocabulary" />}
      />
      <PageBody>
        <BooksGate>{(books) => <VocabularySection books={books} view={view} />}</BooksGate>
      </PageBody>
    </Suspense>
  );
}
