"use client";

import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { BookCover } from "@/components/ui/book-cover";
import { ActionButton } from "@/components/ui/controls";
import { DetailField, DetailFields, DetailSection } from "@/components/ui/detail";
import { NoteBlock } from "@/components/ui/note-block";
import { RelatedNotes } from "@/components/ui/related-notes";
import { StatusBadge, TagList } from "@/components/ui/tag-badge";
import { bookEditHref } from "@/config/routes";
import { KeywordTag } from "@/features/keywords/components/keyword-tag";
import { QuoteBlock, VocabularyItem } from "@/features/notes/components/record-items";
import { useBooks } from "@/hooks/use-books";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";
import { useSheetStore } from "@/stores/use-sheet-store";
import { Book, formatCount, splitLines } from "@/types/book";
import { sameBook } from "@/utils/book-reads";
import { notesForSource } from "@/utils/related-notes";

/** 這本書本身的事實：換誰來讀都一樣，所以跟書名放在一起當書名頁 */
function BookFacts({ book }: { book: Book }) {
  return (
    <DetailFields>
      <div>
        <DetailField label="作者">{book.author}</DetailField>
        <DetailField label="出版社">{book.publisher}</DetailField>
        <DetailField label="ISBN">{book.isbn}</DetailField>
        <DetailField label="語言">{book.language}</DetailField>
      </div>
      <div>
        <DetailField label="頁數">{formatCount(book.pageCount)}</DetailField>
        <DetailField label="字數">{formatCount(book.wordCount)}</DetailField>
        <DetailField label="來源">
          {book.sourceUrl && (
            <a
              href={book.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={book.sourceUrl}
              className="inline-flex items-center gap-1 text-blue-700 underline underline-offset-2 hover:text-blue-900"
            >
              原始頁面
              <ExternalLink size={12} strokeWidth={1.5} aria-hidden />
            </a>
          )}
        </DetailField>
      </div>
    </DetailFields>
  );
}

/** 我對這本書做的事：狀態、讀的時間、在哪讀、怎麼歸類，換個人就是另一組答案 */
function MyMarks({ book }: { book: Book }) {
  return (
    <DetailFields>
      <div>
        <DetailField label="狀態">
          <StatusBadge status={book.status} />
        </DetailField>
        <DetailField label="開始日期">{book.startDate}</DetailField>
        <DetailField label="完成日期">{book.endDate}</DetailField>
      </div>
      <div>
        <DetailField label="平台">
          {book.platform && <TagList values={[book.platform]} tone="platform" />}
        </DetailField>
        <DetailField label="領域">
          {(book.domain || book.subDomain) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <TagList values={[book.domain]} tone="domain" />
              <TagList values={[book.subDomain]} tone="subDomain" />
            </div>
          )}
        </DetailField>
        <DetailField label="屬性">
          {book.type && <TagList values={[book.type]} tone="type" />}
        </DetailField>
      </div>
    </DetailFields>
  );
}

export function BookDetailView() {
  const { id } = useParams<{ id: string }>();
  const { sheetId } = useSheetStore();
  const { books, isLoading, error } = useBooks();
  const { quotes, vocabulary } = useRecords();
  const { writings } = useWritings();
  // 從書單帶進來的檢視方式與頁碼，一路傳給編輯頁，存完才回得到同一個畫面
  const { searchParams } = useUrlParams();
  const back = searchParams.get("back");
  const backHref = back ? `/reading/books?${back}` : "/reading/books";
  const book = books.find((b) => b.id === id);

  if (!sheetId || isLoading || error || !book) {
    return (
      <>
        <PageHeader title="書籍資訊" backHref={backHref} />
        {isLoading && sheetId ? (
          <PageLoading />
        ) : (
          <PageMessage tone={error ? "error" : "muted"}>
            {!sheetId ? "請先到「設定」頁面連接 Google Sheet" : error || "找不到這本書"}
          </PageMessage>
        )}
      </>
    );
  }

  const keywords = splitLines(book.keywords);
  const relatedArticles = splitLines(book.relatedArticles);
  // 佳句與單字綁的是「某一次讀」那一列，所以重讀的那幾列要一起算進來
  const readIds = new Set(sameBook(books, book).map((b) => b.id));
  const bookQuotes = quotes.filter((row) => readIds.has(row.bookId));
  const bookVocabulary = vocabulary.filter((row) => readIds.has(row.bookId));
  const notes = notesForSource(writings, readIds);
  const note = book.note.trim();

  return (
    <>
      <PageHeader
        title="書籍資訊"
        backHref={backHref}
        action={<ActionButton href={bookEditHref(book.id, back)}>編輯</ActionButton>}
      />

      {/* 一份文件：單欄、靠章節標題分段，不切成一張張卡片 */}
      <PageBody>
        <article className="flex w-full flex-col gap-8">
          {/* 書名頁：封面在左，右邊一條垂直線隔開書名與所有欄位 */}
          {/* 不設 items-start，右欄才會被拉到跟封面一樣高，那條垂直線就不會半途斷掉 */}
          <header className="flex gap-4 md:gap-6">
            <BookCover
              url={book.coverUrl}
              title={book.title}
              size="detail"
              className="self-start"
            />
            <div className="border-rule-soft flex min-w-0 flex-1 flex-col gap-4 border-l pl-4 md:pl-6">
              <h2 className="text-xl leading-snug font-semibold break-words text-gray-900 md:text-2xl">
                {book.title}
              </h2>
              <BookFacts book={book} />
            </div>
          </header>

          {/* 書本身的事實在上面的書名頁；這一節以下全是我加上去的，用章節線隔開 */}
          <DetailSection title="標記">
            <MyMarks book={book} />
          </DetailSection>

          {keywords.length > 0 && (
            <DetailSection title="關鍵字">
              <div className="flex flex-wrap items-center gap-1.5">
                {keywords.map((keyword) => (
                  <KeywordTag
                    key={keyword}
                    name={keyword}
                    className="rounded-control bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                  />
                ))}
              </div>
            </DetailSection>
          )}

          {bookQuotes.length > 0 && (
            <DetailSection title="佳句">
              <ul className="flex flex-col gap-5">
                {bookQuotes.map((row) => (
                  <li key={row.id}>
                    <QuoteBlock quote={row} />
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {bookVocabulary.length > 0 && (
            <DetailSection title="單字">
              <ul className="flex flex-col gap-4">
                {bookVocabulary.map((row) => (
                  <VocabularyItem key={row.id} row={row} />
                ))}
              </ul>
            </DetailSection>
          )}

          {note && (
            <DetailSection title="心得">
              {/* 心得是這一頁唯一的長文，只有這一段限行長：一行拉到整個寬螢幕會讀不下去 */}
              <NoteBlock note={note} />
            </DetailSection>
          )}

          {notes.length > 0 && (
            <DetailSection title="紀事">
              <RelatedNotes notes={notes} />
            </DetailSection>
          )}

          {relatedArticles.length > 0 && (
            <DetailSection title="相關文章">
              <ul className="flex flex-col gap-1.5">
                {relatedArticles.map((url) => (
                  <li key={url} className="min-w-0">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={url}
                      className="inline-flex max-w-full items-center gap-1 text-sm text-blue-700 underline underline-offset-2 hover:text-blue-900"
                    >
                      <span className="truncate">{url}</span>
                      <ExternalLink size={12} strokeWidth={1.5} className="shrink-0" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}
        </article>
      </PageBody>
    </>
  );
}
