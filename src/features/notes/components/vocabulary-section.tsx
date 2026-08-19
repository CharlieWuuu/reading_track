"use client";

import { useRouter } from "next/navigation";
import { PageMessage } from "@/components/layout/PageMessage";
import { VocabularyPanel } from "@/features/notes/components/vocabulary-panel";
import { useRecords } from "@/hooks/useRecords";
import { getVocabularyEntries } from "@/lib/vocabularyStats";
import { Book } from "@/types/book";

/** 單字清單：桌機是自己一頁，手機是筆記頁的一個分頁；點一張就進那個詞的編輯頁 */
export function VocabularySection({ books }: { books: Book[] }) {
  const router = useRouter();
  const { vocabulary, isLoading } = useRecords();

  if (isLoading) return <PageMessage>載入中…</PageMessage>;

  return (
    <VocabularyPanel
      entries={getVocabularyEntries(vocabulary, books)}
      onEdit={(entry) => router.push(`/vocabulary/${encodeURIComponent(entry.word)}/edit`)}
    />
  );
}
