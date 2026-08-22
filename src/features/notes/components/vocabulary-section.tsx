"use client";

import { useRouter } from "next/navigation";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { VocabularyPanel } from "@/features/notes/components/vocabulary-panel";
import { useRecords } from "@/hooks/use-records";
import { Book } from "@/types/book";
import { getVocabularyEntries } from "@/utils/vocabulary-stats";

/** 單字清單：桌機是自己一頁，手機是筆記頁的一個分頁；點一張就進那個詞的編輯頁 */
export function VocabularySection({ books }: { books: Book[] }) {
  const router = useRouter();
  const { vocabulary, isLoading } = useRecords();

  if (isLoading) return <PageLoading />;

  return (
    <VocabularyPanel
      writings={getVocabularyEntries(vocabulary, books)}
      onEdit={(writings) =>
        router.push(`/reading/vocabulary/${encodeURIComponent(writings.word)}/edit`)
      }
    />
  );
}
