"use client";

import { useRouter } from "next/navigation";
import { PageLoading } from "@/components/layout/page-loading";
import { VocabularyPanel } from "@/features/notes/components/vocabulary-panel";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { Book } from "@/types/book";
import { filterVocabularyByLanguage, getVocabularyEntries } from "@/utils/vocabulary-stats";

/** 單字清單：桌機是自己一頁，手機是筆記頁的一個分頁；點一張就進那個詞的編輯頁 */
export function VocabularySection({ books }: { books: Book[] }) {
  const router = useRouter();
  const { vocabulary, isLoading } = useRecords();
  const { searchParams } = useUrlParams();

  if (isLoading) return <PageLoading />;

  return (
    <VocabularyPanel
      writings={filterVocabularyByLanguage(
        getVocabularyEntries(vocabulary, books),
        searchParams.get("lang") ?? "",
      )}
      onEdit={(writings) =>
        router.push(`/reading/vocabulary/${encodeURIComponent(writings.word)}/edit`)
      }
    />
  );
}
