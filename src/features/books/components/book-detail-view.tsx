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
import { Book, formatCount, splitLines } from "@/types/book";
import { sameBook } from "@/utils/book-reads";
import { notesForSource } from "@/utils/related-notes";

/** 這本書本身的事實：換誰來讀都一樣，所以跟書名放在一起當書名頁 */
function BookFacts({ book }: { book: Book }) {
  return (
    <DetailFields>
      <div>
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

/**
 * 讀過幾次。只有重讀的書才畫——讀一次的書多一個「讀過 1 次」的區塊是廢話。
 *
 * 書單一本書只佔一列，所以次數只有在這裡看得到。
 */
function ReadingHistory({ reads }: { reads: Book[] }) {
  const ordered = [...reads].sort((a, b) =>
    (a.startDate ?? a.endDate ?? "").localeCompare(b.startDate ?? b.endDate ?? ""),
  );

  return (
    <ol className="flex flex-col gap-2">
      {ordered.map((read, i) => (
        <li key={read.id} className="flex items-baseline gap-3 text-sm">
          <span className="shrink-0 text-xs text-gray-400 tabular-nums">第 {i + 1} 次</span>
          <span className="text-gray-700 tabular-nums">
            {[read.startDate, read.endDate].filter(Boolean).join(" – ") || "沒有日期"}
          </span>
          {read.platform && <span className="text-xs text-gray-400">{read.platform}</span>}
        </li>
      ))}
    </ol>
  );
}

/**
 * 進這一頁最先想知道的三件事：讀完了沒、什麼時候讀的、在哪讀的。
 * 它們原本排在分類旁邊，得先捲過封面與 ISBN 才看得到，所以提到書名底下。
 */
function ReadingMeta({ book }: { book: Book }) {
  const span = [book.startDate, book.endDate].filter(Boolean).join(" – ");
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-gray-500">
      <StatusBadge status={book.status} />
      {span && <span className="tabular-nums">{span}</span>}
      {book.platform && <TagList values={[book.platform]} tone="platform" />}
    </div>
  );
}

/** 怎麼歸類的。狀態與日期提到書名底下之後，這一節只剩分類 */
function Classification({ book }: { book: Book }) {
  return (
    <DetailFields>
      <div>
        <DetailField label="領域">
          {(book.domain || book.subDomain) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <TagList values={[book.domain]} tone="domain" />
              <TagList values={[book.subDomain]} tone="subDomain" />
            </div>
          )}
        </DetailField>
      </div>
      <div>
        <DetailField label="屬性">
          {book.type && <TagList values={[book.type]} tone="type" />}
        </DetailField>
      </div>
    </DetailFields>
  );
}

export function BookDetailView() {
  const { id } = useParams<{ id: string }>();
  const { books, isLoading, error } = useBooks();
  const { quotes, vocabulary } = useRecords();
  const { writings } = useWritings();
  // 從書單帶進來的檢視方式與頁碼，一路傳給編輯頁，存完才回得到同一個畫面
  const { searchParams } = useUrlParams();
  const back = searchParams.get("back");
  const backHref = back ? `/reading/books?${back}` : "/reading/books";
  const book = books.find((b) => b.id === id);

  if (isLoading || error || !book) {
    return (
      <>
        <PageHeader title="書籍資訊" backHref={backHref} />
        {/* 訊息也走 PageBody：不然它只是頁首下面一個小方塊，跟載入中的位置對不齊 */}
        <PageBody>
          {isLoading ? (
            <PageLoading />
          ) : (
            <PageMessage tone={error ? "error" : "muted"} fill>
              {error || "找不到這本書"}
            </PageMessage>
          )}
        </PageBody>
      </>
    );
  }

  const keywords = splitLines(book.keywords);
  const relatedArticles = splitLines(book.relatedArticles);
  // 佳句與單字綁的是「某一次讀」那一列，所以重讀的那幾列要一起算進來
  const reads = sameBook(books, book);
  const readIds = new Set(reads.map((b) => b.id));
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
          {/* 書名頁：書名獨佔一行，底下才是封面與欄位 */}
          {/* 書名跟封面並排時只剩半個寬度，長書名要斷成三四行才擺得下 */}
          <header className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl leading-tight font-semibold break-words text-gray-900 md:text-3xl">
                {book.title}
              </h2>
              {/* 作者與出版社緊跟著書名，是書名的一部分，不必再排進下面的資訊表 */}
              {(book.author || book.publisher) && (
                <p className="text-sm text-gray-500">
                  {[book.author, book.publisher].filter(Boolean).join("｜")}
                </p>
              )}
            </div>

            <ReadingMeta book={book} />
            {/* 不設 items-start，右欄才會被拉到跟封面一樣高，那條垂直線就不會半途斷掉 */}
            <div className="flex gap-4 md:gap-6">
              <BookCover
                url={book.coverUrl}
                title={book.title}
                size="detail"
                className="self-start"
              />
              <div className="border-rule-soft flex min-w-0 flex-1 flex-col gap-4 border-l pl-4 md:pl-6">
                <BookFacts book={book} />
              </div>
            </div>
          </header>

          {/* 書本身的事實在上面的書名頁；這一節以下全是我加上去的，用章節線隔開 */}
          <DetailSection title="分類">
            <Classification book={book} />
          </DetailSection>

          {reads.length > 1 && (
            <DetailSection title="讀過的次數">
              <ReadingHistory reads={reads} />
            </DetailSection>
          )}

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
