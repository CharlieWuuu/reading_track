"use client";

import { useRouter } from "next/navigation";
import { VocabularyPanel } from "@/components/notes/VocabularyPanel";
import { useRecords } from "@/lib/useRecords";
import { getVocabularyEntries } from "@/lib/vocabularyStats";
import { Book } from "@/types/book";

/** 單字清單：桌機是自己一頁，手機是筆記頁的一個分頁；點一張就進那個詞的編輯頁 */
export function VocabularySection({ books }: { books: Book[] }) {
  const router = useRouter();
  const { vocabulary } = useRecords();

  return (
    <VocabularyPanel
      entries={getVocabularyEntries(vocabulary, books)}
      onEdit={(entry) => router.push(`/vocabulary/${encodeURIComponent(entry.word)}/edit`)}
    />
  );
}
