"use client";

import { useParams, useRouter } from "next/navigation";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { VocabularyForm } from "@/features/notes/components/vocabulary-form";
import { useBooks } from "@/hooks/use-books";
import { useRecordEdits } from "@/hooks/use-record-edits";
import { useRecords } from "@/hooks/use-records";
import { getVocabularyEntries } from "@/utils/vocabulary-stats";

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
  const writings = getVocabularyEntries(vocabulary, books).find((e) => e.word === name);

  return (
    <>
      <PageHeader title={name} backHref="/reading/vocabulary" />
      <PageBody>
        <RecordGate
          loading={isLoading || loadingBooks}
          error={error}
          missing={!writings && "找不到這個詞"}
        >
          {writings && (
            <VocabularyForm
              writings={writings}
              onSave={saveVocabulary}
              onDone={() => router.back()}
            />
          )}
        </RecordGate>
      </PageBody>
    </>
  );
}
