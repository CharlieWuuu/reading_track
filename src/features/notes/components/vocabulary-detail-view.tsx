"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { BookCover } from "@/components/ui/book-cover";
import { ActionButton } from "@/components/ui/controls";
import { DetailSection } from "@/components/ui/detail";
import { RelatedNotes } from "@/components/ui/related-notes";
import { bookHref, vocabularyEditHref } from "@/config/routes";
import { useBooks } from "@/hooks/use-books";
import { useRecords } from "@/hooks/use-records";
import { useWritings } from "@/hooks/use-writings";
import { sameBook } from "@/utils/book-reads";
import { notesForSource } from "@/utils/related-notes";
import { getVocabularyEntries } from "@/utils/stats/vocabulary-stats";

/**
 * 一個詞自己的一頁。
 *
 * 認的是詞不是編號：同一個詞在不同書各有一列，這一頁把每一次相遇列在一起，
 * 那正是「我在哪些書遇過這個字」——拆成一列一頁就看不到這件事。
 */
export function VocabularyDetailView() {
  const { word } = useParams<{ word: string }>();
  const name = decodeURIComponent(word);
  const { books, isLoading: loadingBooks } = useBooks();
  const { vocabulary, isLoading, error } = useRecords();
  const { writings } = useWritings();
  const entry = getVocabularyEntries(vocabulary, books).find((e) => e.word === name);

  // 一個詞可能在好幾本書遇過，每一本（含重讀的那幾列）的紀事都算相關
  const bookIds = (entry?.encounters ?? []).flatMap((e) => {
    const book = books.find((b) => b.id === e.bookId);
    return book ? sameBook(books, book).map((b) => b.id) : [];
  });
  const notes = notesForSource(writings, bookIds);

  const pronunciation = entry?.encounters.find((e) => e.pronunciation)?.pronunciation ?? "";
  const translations = [
    ...new Set(entry?.encounters.map((e) => e.wordTranslation).filter(Boolean)),
  ];

  return (
    <>
      <PageHeader
        title={name}
        backHref="/reading/vocabulary"
        action={entry && <ActionButton href={vocabularyEditHref(name)}>編輯</ActionButton>}
      />
      <PageBody>
        <RecordGate
          loading={isLoading || loadingBooks}
          error={error}
          missing={!entry && "找不到這個詞"}
        >
          {entry && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-2xl font-semibold">{name}</p>
                {pronunciation && <p className="text-sm text-gray-400">{pronunciation}</p>}
                {translations.length > 0 && (
                  <p className="text-sm text-gray-600">{translations.join("、")}</p>
                )}
              </div>

              <DetailSection title={`遇過 ${entry.encounters.length} 次`}>
                <ul className="divide-rule-soft flex flex-col divide-y">
                  {entry.encounters.map((encounter, i) => (
                    <li key={i} className="flex flex-col gap-1 py-3 first:pt-0">
                      <Link
                        href={encounter.bookId ? bookHref(encounter.bookId) : "#"}
                        className="flex items-center gap-2 text-xs text-gray-500 hover:underline"
                      >
                        <BookCover
                          url={encounter.bookCover}
                          title={encounter.bookTitle}
                          size="xs"
                        />
                        {encounter.bookTitle}
                        {encounter.chapter && <span>・{encounter.chapter}</span>}
                      </Link>
                      {encounter.sentence && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                          {encounter.sentence}
                        </p>
                      )}
                      {encounter.sentenceTranslation && (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap text-gray-400">
                          {encounter.sentenceTranslation}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </DetailSection>

              {notes.length > 0 && (
                <DetailSection title="這些書的紀事">
                  <RelatedNotes notes={notes} />
                </DetailSection>
              )}
            </div>
          )}
        </RecordGate>
      </PageBody>
    </>
  );
}
