"use client";

import { useRouter } from "next/navigation";
import { PageMessage } from "@/components/layout/page-message";
import { VocabularyPanel } from "@/features/notes/components/vocabulary-panel";
import { useRecords } from "@/hooks/use-records";
import { Book } from "@/types/book";
import { getVocabularyEntries } from "@/utils/vocabulary-stats";

/** 單字清單：桌機是自己一頁，手機是筆記頁的一個分頁；點一張就進那個詞的編輯頁 */
export function VocabularySection({ books }: { books: Book[] }) {
  const router = useRouter();
  const { vocabulary, isLoading } = useRecords();

  if (isLoading) return <PageMessage>載入中…</PageMessage>;

  return (
    <VocabularyPanel
      journal={getVocabularyEntries(vocabulary, books)}
      onEdit={(journal) =>
        router.push(`/reading/vocabulary/${encodeURIComponent(journal.word)}/edit`)
      }
    />
  );
}
