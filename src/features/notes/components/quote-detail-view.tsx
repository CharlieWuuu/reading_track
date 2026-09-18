"use client";

import Link from "next/link";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { BookCover } from "@/components/ui/book-cover";
import { ActionButton } from "@/components/ui/controls";
import { DetailField, DetailHeader, DetailSection } from "@/components/ui/detail";
import { Quote } from "@/components/ui/quote";
import { RelatedNotes } from "@/components/ui/related-notes";
import { kindHref } from "@/config/kind-routes";
import { bookHref, quoteEditHref } from "@/config/routes";
import { useBooks } from "@/hooks/use-books";
import { useRecords } from "@/hooks/use-records";
import { useWritings } from "@/hooks/use-writings";
import { sameBook } from "@/utils/book-reads";
import { notesByKind, notesForSource } from "@/utils/related-notes";
import { getQuoteRecords } from "@/utils/stats/vocabulary-stats";

/**
 * 一句佳句自己的一頁。
 *
 * 存在的理由不是「看一句話要一整頁」，是它要有網址：從書、從搜尋、從別人的
 * 分享連進來都指得到同一句，之後「相關筆記」也才有地方放。
 */
export function QuoteDetailView({ recordId }: { recordId: string }) {
  const id = recordId;
  const { books, isLoading: loadingBooks } = useBooks();
  const { quotes, isLoading, error } = useRecords();
  const { writings } = useWritings();
  const quote = getQuoteRecords(quotes, books).find((q) => q.id === id);

  // 佳句本身沒有紀事，它的相關筆記是「那本書的紀事」——重讀的每一列都算
  const book = books.find((b) => b.id === quote?.bookId);
  const notes = notesForSource(writings, book ? sameBook(books, book).map((b) => b.id) : []);

  return (
    <>
      <PageHeader
        title={quote?.bookTitle ?? "佳句"}
        size="compact"
        parent={[
          { label: "片段", href: "/fragments" },
          { label: "佳句", href: kindHref("fragments", "quotes") },
        ]}
        backHref={kindHref("fragments", "quotes")}
        action={quote && <ActionButton href={quoteEditHref(quote.id)}>編輯</ActionButton>}
      />
      <PageBody>
        <RecordGate
          loading={isLoading || loadingBooks}
          error={error}
          missing={!quote && "找不到這一句"}
        >
          {quote && (
            <div className="flex flex-col gap-8">
              {/* 主角是句子本身，所以標題的位置放引用版式 */}
              <DetailHeader
                facts={
                  <>
                    <DetailField label="出自" align="right">
                      {quote.bookId ? (
                        <Link
                          href={bookHref(quote.bookId)}
                          className="inline-flex items-center gap-2 hover:underline"
                        >
                          <BookCover url={quote.bookCover} title={quote.bookTitle} size="xs" />
                          {quote.bookTitle}
                        </Link>
                      ) : (
                        quote.bookTitle
                      )}
                    </DetailField>
                    <DetailField label="章節" align="right">
                      {quote.chapter}
                    </DetailField>
                  </>
                }
              >
                <div className="min-w-0 flex-1">
                  <Quote text={quote.text} />
                </div>
              </DetailHeader>

              {quote.note.trim() && (
                <DetailSection title="想法">
                  <p className="text-sm leading-loose whitespace-pre-wrap text-gray-700">
                    {quote.note}
                  </p>
                </DetailSection>
              )}

              {notesByKind(notes).map((group) => (
                <DetailSection
                  key={group.kindName}
                  title={`這本書的${group.kindName}`}
                  count={`${group.notes.length} 項`}
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
