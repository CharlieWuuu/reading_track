"use client";

import { useParams, useRouter } from "next/navigation";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { VocabularyForm } from "@/components/notes/VocabularyForm";
import { useRecordEdits } from "@/lib/recordEdits";
import { useBooks } from "@/lib/useBooks";
import { useRecords } from "@/lib/useRecords";
import { getVocabularyEntries } from "@/lib/vocabularyStats";

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
      <PageHeader title={name} backHref="/vocabulary" />
      <PageBody>
        {isLoading || loadingBooks ? (
          <PageMessage>載入中…</PageMessage>
        ) : error || !entry ? (
          <PageMessage tone={error ? "error" : "muted"}>{error || "找不到這個詞"}</PageMessage>
        ) : (
          <VocabularyForm entry={entry} onSave={saveVocabulary} onDone={() => router.back()} />
        )}
      </PageBody>
    </>
  );
}
