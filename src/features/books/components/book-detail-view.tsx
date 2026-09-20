"use client";

import { ExternalLink } from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { BookCover } from "@/components/ui/book-cover";
import { ActionButton } from "@/components/ui/controls";
import { DetailField, DetailHeader, DetailHeading, DetailTitle } from "@/components/ui/detail";
import { NoteBlock } from "@/components/ui/note-block";
import { Quote } from "@/components/ui/quote";
import { RelatedNotes } from "@/components/ui/related-notes";
import { StatusBadge } from "@/components/ui/tag-badge";
import { kindHref } from "@/config/kind-routes";
import { PRIVATE_MARK } from "@/config/privacy";
import { bookEditHref, quotesListHref, vocabularyListHref } from "@/config/routes";
import { KeywordTag } from "@/features/keywords/components/keyword-tag";
import { VocabularyItem } from "@/features/notes/components/record-items";
import { useBooks } from "@/hooks/use-books";
import { useKinds } from "@/hooks/use-kinds";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";
import { Kind } from "@/lib/db/queries/kinds";
import { Book, formatCount, splitLines } from "@/types/book";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { sameBook } from "@/utils/book-reads";
import { detailFields } from "@/utils/detail-fields";
import { notesByKind, notesForSource } from "@/utils/related-notes";

/** 一次讀完就知道的四個數字：書裡留下了多少東西，緊接在量化資訊行下面 */
function CountStats({
  quotes,
  vocabulary,
  notes,
  keywords,
}: {
  quotes: number;
  vocabulary: number;
  notes: number;
  keywords: number;
}) {
  const items = [
    { label: "佳句", value: quotes },
    { label: "單字", value: vocabulary },
    { label: "紀事", value: notes },
    { label: "關鍵字", value: keywords },
  ];
  return (
    <div className="border-rule-soft mt-1.5 flex gap-8 border-t pt-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="font-serif text-2xl font-semibold text-gray-900">{item.value}</div>
          <span className="text-label text-ink-faint tracking-label uppercase">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * 右欄的資料卡。狀態與來源自己畫（一個是推論出來的徽章、一個要開新分頁），
 * 其餘照類型勾的模組列——本來六格全寫死，設定頁改了這裡不會變。
 */
function BookFacts({ book, kind }: { book: Book; kind?: Kind }) {
  const { shorts } = kind
    ? detailFields(kind, bookValues(book), SKIP_IN_FACTS)
    : { shorts: [] as ReturnType<typeof detailFields>["shorts"] };

  return (
    <>
      <DetailField label="狀態" align="right">
        <StatusBadge status={book.status} />
      </DetailField>
      {shorts.map((field) => (
        <DetailField key={field.key} label={field.label} align="right">
          {field.value}
        </DetailField>
      ))}
      <DetailField label="來源" align="right">
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
    </>
  );
}

/** 標題那一區與量化資訊行已經講過的，右欄不重複列 */
const SKIP_IN_FACTS = new Set([
  "title",
  "creator",
  "coverUrl",
  "body",
  "domain",
  "subDomain",
  "amount",
  "platform",
  "externalUrl",
]);

/** Book 的舊形狀攤成模組那層的欄位名，才接得上照模組畫的那套 */
function bookValues(book: Book): Record<string, string> {
  return {
    title: book.title,
    creator: book.author,
    coverUrl: book.coverUrl,
    startDate: book.startDate ?? "",
    endDate: book.endDate ?? "",
    language: book.language,
    platform: book.platform,
    externalId: book.isbn,
    amount: book.pageCount,
    domain: book.domain,
    subDomain: book.subDomain,
    attribute: book.type,
    body: book.note,
    isPrivate: book.private === PRIVATE_MARK ? "是" : "否",
  };
}

/** 右欄的佳句清單：只列前幾則，其餘去列表頁看 */
function QuotePreview({ quotes }: { quotes: QuoteRow[] }) {
  const preview = quotes.slice(0, 3);
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <DetailHeading title="佳句" count={`${quotes.length} 則`} />
      <ul className="divide-rule flex flex-col divide-y">
        {preview.map((row) => (
          <li key={row.id} className="py-3 first:pt-0">
            <Quote text={row.text} source={row.chapter} />
          </li>
        ))}
      </ul>
      {quotes.length > preview.length && (
        <a href={quotesListHref} className="text-meta text-ink-faint hover:text-ink">
          看全部 {quotes.length} 則 →
        </a>
      )}
    </div>
  );
}

/** 右欄的單字清單：只列前幾個，其餘去列表頁看 */
function VocabularyPreview({ vocabulary }: { vocabulary: VocabularyRow[] }) {
  const preview = vocabulary.slice(0, 4);
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <DetailHeading title="單字" count={`${vocabulary.length} 個`} />
      <ul className="divide-rule flex flex-col divide-y">
        {preview.map((row) => (
          <VocabularyItem key={row.id} row={row} />
        ))}
      </ul>
      {vocabulary.length > preview.length && (
        <a href={vocabularyListHref} className="text-meta text-ink-faint hover:text-ink">
          看全部 {vocabulary.length} 個 →
        </a>
      )}
    </div>
  );
}

export function BookDetailView({ recordId }: { recordId: string }) {
  const id = recordId;
  const { books, isLoading, error } = useBooks();
  const { quotes, vocabulary } = useRecords();
  const { writings } = useWritings();
  const { kinds } = useKinds();
  const bookKind = kinds.find((k) => k.slug === "books");
  // 從書單帶進來的檢視方式與頁碼，一路傳給編輯頁，存完才回得到同一個畫面
  const { searchParams } = useUrlParams();
  const back = searchParams.get("back");
  const booksListHref = kindHref("records", "books");
  const backHref = back ? `${booksListHref}?${back}` : booksListHref;
  const book = books.find((b) => b.id === id);

  if (isLoading || error || !book) {
    return (
      <>
        <PageHeader title="書籍資訊" size="compact" backHref={backHref} />
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
  // 佳句與單字綁的是「某一次讀」那一列，所以重讀的那幾列要一起算進來
  const reads = sameBook(books, book);
  const readIds = new Set(reads.map((b) => b.id));
  const bookQuotes = quotes.filter((row) => readIds.has(row.bookId));
  const bookVocabulary = vocabulary.filter((row) => readIds.has(row.bookId));
  const notes = notesForSource(writings, readIds);
  const note = book.note.trim();
  const noteCount = (note ? 1 : 0) + notes.length;

  // 量化資訊行：領域、子領域、頁數、平台，缺的項目自動不留空隙
  const quantLine = [
    book.domain,
    book.subDomain,
    formatCount(book.pageCount) && `${formatCount(book.pageCount)} 頁`,
    book.platform,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader
        title="詳情"
        parent={[
          { label: "紀錄", href: "/records" },
          { label: "書籍", href: booksListHref },
        ]}
        backHref={backHref}
        action={<ActionButton href={bookEditHref(book.id, back)}>編輯</ActionButton>}
      />

      <PageBody>
        <article className="flex w-full flex-col gap-8">
          {/* 書名頁：封面＋書名／作者／量化資訊／統計數字在左，固定資料卡在右 */}
          <DetailHeader facts={<BookFacts book={book} kind={bookKind} />}>
            <BookCover
              url={book.coverUrl}
              title={book.title}
              size="detail"
              className="shrink-0 self-start"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <DetailTitle title={book.title} subtitle={book.author} />
              {quantLine && <p className="text-meta text-ink-faint">{quantLine}</p>}
              <CountStats
                quotes={bookQuotes.length}
                vocabulary={bookVocabulary.length}
                notes={noteCount}
                keywords={keywords.length}
              />
            </div>
          </DetailHeader>

          {/* 主內容雙欄：左邊書寫（含關鍵字），右邊佳句／單字清單 */}
          <div className="flex flex-col gap-8 md:flex-row">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              {/* 這本書自己那欄心得，跟連過來的書寫是兩回事，各自一區 */}
              {note && (
                <>
                  <DetailHeading title="心得" count="1 則" />
                  <NoteBlock note={note} />
                </>
              )}

              {/* 一種類型一區：思緒掛在寫著「心得」的標題底下對不起來 */}
              {notesByKind(notes).map((group) => (
                <div key={group.kindName} className="flex flex-col gap-3">
                  <DetailHeading title={group.kindName} count={`${group.notes.length} 則`} />
                  <RelatedNotes notes={group.notes} />
                </div>
              ))}

              {keywords.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  <span className="text-label text-ink-faint tracking-label uppercase">關鍵字</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {keywords.map((keyword) => (
                      <KeywordTag
                        key={keyword}
                        name={keyword}
                        className="rounded-control bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(bookQuotes.length > 0 || bookVocabulary.length > 0) && (
              <div className="flex w-full flex-col gap-8 md:w-80 md:shrink-0 md:border-l md:pl-7">
                {bookQuotes.length > 0 && <QuotePreview quotes={bookQuotes} />}
                {bookVocabulary.length > 0 && <VocabularyPreview vocabulary={bookVocabulary} />}
              </div>
            )}
          </div>
        </article>
      </PageBody>
    </>
  );
}
