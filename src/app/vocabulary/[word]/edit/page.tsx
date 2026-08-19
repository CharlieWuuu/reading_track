"use client";

import { useParams, useRouter } from "next/navigation";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { VocabularyForm } from "@/features/notes/components/vocabulary-form";
import { useBooks } from "@/hooks/useBooks";
import { useRecordEdits } from "@/hooks/useRecordEdits";
import { useRecords } from "@/hooks/useRecords";
import { getVocabularyEntries } from "@/utils/vocabularyStats";

/**
 * 一個詞自己的編輯頁。
 *
 * 網址上是詞本身而不是編號：同一個詞在不同書各有一列，這一頁要一次改完，
 * 所以它認的是「這個詞」，不是其中某一列。
 */
export default function EditVocabularyPage() {
  const router = useRouter();
  const { word } = useParams<{ word: string }>();
  const { books, isLoading: loadingBooks } = useBooks();
  const { vocabulary, isLoading, error } = useRecords();
  const { saveVocabulary } = useRecordEdits(books);

  const name = decodeURIComponent(word);
  const entry = getVocabularyEntries(vocabulary, books).find((e) => e.word === name);

  return (
    <>
      <PageHeader title={name} backHref="/notes?tab=vocabulary" />
      <PageBody>
        <RecordGate
          loading={isLoading || loadingBooks}
          error={error}
          missing={!entry && "找不到這個詞"}
        >
          {entry && (
            <VocabularyForm entry={entry} onSave={saveVocabulary} onDone={() => router.back()} />
          )}
        </RecordGate>
      </PageBody>
    </>
  );
}
