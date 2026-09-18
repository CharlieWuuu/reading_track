"use client";

import Link from "next/link";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { BookCover } from "@/components/ui/book-cover";
import { ActionButton } from "@/components/ui/controls";
import { DetailField, DetailHeader, DetailSection, DetailTitle } from "@/components/ui/detail";
import { RelatedNotes } from "@/components/ui/related-notes";
import { kindHref } from "@/config/kind-routes";
import { bookHref, vocabularyEditHref } from "@/config/routes";
import { useBooks } from "@/hooks/use-books";
import { useRecords } from "@/hooks/use-records";
import { useWritings } from "@/hooks/use-writings";
import { sameBook } from "@/utils/book-reads";
import { notesByKind, notesForSource } from "@/utils/related-notes";
import { getVocabularyEntries } from "@/utils/stats/vocabulary-stats";

/**
 * 一個詞自己的一頁。
 *
 * 認的是詞不是編號：同一個詞在不同書各有一列，這一頁把每一次相遇列在一起，
 * 那正是「我在哪些書遇過這個字」——拆成一列一頁就看不到這件事。
 */
export function VocabularyDetailView({ recordId }: { recordId: string }) {
  // 單字的網址那一段是詞本身不是編號：同一個詞在不同書各有一列，這一頁一次列完
  const name = decodeURIComponent(recordId);
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
        size="compact"
        parent={[
          { label: "片段", href: "/fragments" },
          { label: "單字", href: kindHref("fragments", "vocabulary") },
        ]}
        backHref={kindHref("fragments", "vocabulary")}
        action={entry && <ActionButton href={vocabularyEditHref(name)}>編輯</ActionButton>}
      />
      <PageBody>
        <RecordGate
          loading={isLoading || loadingBooks}
          error={error}
          missing={!entry && "找不到這個詞"}
        >
          {entry && (
            <div className="flex flex-col gap-8">
              <DetailHeader
                facts={
                  <>
                    <DetailField label="讀音" align="right">
                      {pronunciation}
                    </DetailField>
                    <DetailField label="字義" align="right">
                      {translations.join("、")}
                    </DetailField>
                    <DetailField label="遇過" align="right">
                      {`${entry.encounters.length} 次`}
                    </DetailField>
                  </>
                }
              >
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <DetailTitle title={name} />
                </div>
              </DetailHeader>

              <DetailSection title="遇過" count={`${entry.encounters.length} 次`}>
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
                      {encounter.example && (
                        <p className="text-sm leading-loose whitespace-pre-wrap text-gray-800">
                          {encounter.example}
                        </p>
                      )}
                      {encounter.exampleTranslation && (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap text-gray-400">
                          {encounter.exampleTranslation}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </DetailSection>

              {notesByKind(notes).map((group) => (
                <DetailSection
                  key={group.kindName}
                  title={`這些書的${group.kindName}`}
                  count={`${group.notes.length} 則`}
                >
                  <RelatedNotes notes={group.notes} />
                </DetailSection>
              ))}
            </div>
          )}
        </RecordGate>
      </PageBody>
    </>
  );
}
