"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { TagList as OptionList, StatusBadge } from "@/components/ui/TagBadge";
import { instapaperReadUrl } from "@/lib/instapaper/readUrl";
import { useArticles } from "@/lib/useArticles";
import { useBooks } from "@/lib/useBooks";
import { useRecords } from "@/lib/useRecords";
import { useUrlParams } from "@/lib/useUrlParam";
import { useSheetStore } from "@/store/useSheetStore";
import { Book, formatCount, splitLines } from "@/types/book";
import { QuoteRow, VocabularyRow } from "@/types/record";

/** 詳細頁的封面：固定寬度，資訊區才不會隨封面比例左右跳 */
function Cover({ url, title }: { url: string; title: string }) {
  // self-start：右欄被拉高時封面要維持自己的比例，不能跟著一起拉長
  const shape =
    "aspect-2/3 w-24 shrink-0 self-start rounded object-cover shadow ring-1 ring-black/10 md:w-32";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={shape} />;
  }
  return (
    <div
      className={`${shape} flex items-center justify-center bg-gray-100 p-2 text-center text-xs leading-snug text-gray-400`}
    >
      {title.slice(0, 12) || "—"}
    </div>
  );
}

/**
 * 章節標題：一行小字加一條細線，就是文件裡的分節。
 * 這一頁刻意不用卡片——一本書的資料是一份文件，不是十張獨立的小卡。
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="border-b border-gray-200 pb-1.5 text-xs text-gray-400">{title}</h3>
      {children}
    </section>
  );
}

/** 資訊表的一列：欄位名稱在左，值在右，中間靠固定欄寬對齊成一直排 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-3 py-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="min-w-0 text-sm text-gray-800">{children || "—"}</div>
    </div>
  );
}

/** 佳句照書裡的樣子排：引文用襯線字並縮排，章節與心得退到旁邊當註腳 */
function QuoteItem({ quote }: { quote: QuoteRow }) {
  return (
    <li className="flex flex-col gap-1.5">
      <blockquote className="border-l-2 border-gray-300 pl-4 font-serif text-[15px] leading-relaxed whitespace-pre-wrap text-gray-800 md:text-base">
        {quote.text}
      </blockquote>
      {(quote.chapter || quote.note) && (
        <p className="pl-4 text-xs leading-relaxed text-gray-400">
          {quote.chapter}
          {quote.chapter && quote.note && "　"}
          {quote.note && <span className="whitespace-pre-wrap">{quote.note}</span>}
        </p>
      )}
    </li>
  );
}

/** 單字排成詞條：單字與翻譯同一行，例句與翻譯縮排在下面 */
function VocabularyItem({ row }: { row: VocabularyRow }) {
  return (
    <li className="flex flex-col gap-0.5">
      <p className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm font-medium text-gray-900">{row.word}</span>
        {row.wordTranslation && (
          <span className="text-sm text-gray-500">{row.wordTranslation}</span>
        )}
        {row.chapter && <span className="text-xs text-gray-400">{row.chapter}</span>}
      </p>
      {row.sentence && (
        <p className="pl-4 text-xs leading-relaxed whitespace-pre-wrap text-gray-600">
          {row.sentence}
        </p>
      )}
      {row.sentenceTranslation && (
        <p className="pl-4 text-xs leading-relaxed whitespace-pre-wrap text-gray-400">
          {row.sentenceTranslation}
        </p>
      )}
    </li>
  );
}

/** 短欄位排成兩欄的資訊表，每列之間一條淺色分隔線，讀起來像一份目錄 */
function Fields({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 [&>div]:divide-y [&>div]:divide-gray-100">
      {children}
    </div>
  );
}

/** 這本書本身的事實：換誰來讀都一樣，所以跟書名放在一起當書名頁 */
function BookFacts({ book }: { book: Book }) {
  return (
    <Fields>
      <div>
        <Field label="作者">{book.author}</Field>
        <Field label="出版社">{book.publisher}</Field>
        <Field label="語言">{book.language}</Field>
      </div>
      <div>
        <Field label="頁數">{formatCount(book.pageCount)}</Field>
        <Field label="字數">{formatCount(book.wordCount)}</Field>
        <Field label="來源">
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
        </Field>
      </div>
    </Fields>
  );
}

/** 我對這本書做的事：狀態、讀的時間、在哪讀、怎麼歸類，換個人就是另一組答案 */
function MyMarks({ book }: { book: Book }) {
  return (
    <Fields>
      <div>
        <Field label="狀態">
          <StatusBadge status={book.status} />
        </Field>
        <Field label="開始日期">{book.startDate}</Field>
        <Field label="完成日期">{book.endDate}</Field>
      </div>
      <div>
        <Field label="平台">
          {book.platform && <OptionList values={[book.platform]} tone="platform" />}
        </Field>
        <Field label="領域">
          {(book.domain || book.subDomain) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <OptionList values={[book.domain]} tone="domain" />
              <OptionList values={[book.subDomain]} tone="subDomain" />
            </div>
          )}
        </Field>
        <Field label="屬性">{book.type && <OptionList values={[book.type]} tone="type" />}</Field>
      </div>
    </Fields>
  );
}

export function BookDetailView() {
  const { id } = useParams<{ id: string }>();
  const { sheetId } = useSheetStore();
  const { books, isLoading, error } = useBooks();
  const { articles } = useArticles();
  const { quotes, vocabulary } = useRecords();
  // 從書單帶進來的檢視方式與頁碼，一路傳給編輯頁，存完才回得到同一個畫面
  const { searchParams } = useUrlParams();
  const back = searchParams.get("back");
  const backHref = back ? `/books?${back}` : "/books";
  const book = books.find((b) => b.id === id);

  if (!sheetId || isLoading || error || !book) {
    return (
      <>
        <PageHeader title="書籍資訊" />
        <PageMessage tone={error ? "error" : "muted"}>
          {!sheetId
            ? "請先到「設定」頁面連接 Google Sheet"
            : isLoading
              ? "載入中…"
              : error || "找不到這本書"}
        </PageMessage>
      </>
    );
  }

  // 相關文章存的是網址，標題從已抓下來的 Instapaper 清單對回去；對不到就顯示網址本身
  const articleTitles = new Map<string, string>();
  for (const a of articles) {
    const title = a.title || a.url;
    if (a.url) articleTitles.set(a.url, title);
    articleTitles.set(instapaperReadUrl(a.bookmark_id, a.url), title);
  }

  const keywords = splitLines(book.keywords);
  const relatedArticles = splitLines(book.relatedArticles);
  const bookQuotes = quotes.filter((row) => row.bookId === book.id);
  const bookVocabulary = vocabulary.filter((row) => row.bookId === book.id);
  const note = book.note.trim();

  return (
    <>
      <PageHeader
        title="書籍資訊"
        backHref={backHref}
        action={
          <Link
            href={`/books/${book.id}/edit${back ? `?back=${encodeURIComponent(back)}` : ""}`}
            className="flex h-8 items-center rounded bg-gray-900 px-3 text-sm font-medium text-white hover:bg-gray-700 md:h-9 md:px-4"
          >
            編輯
          </Link>
        }
      />

      {/* 一份文件：單欄、靠章節標題分段，不切成一張張卡片 */}
      <PageBody>
        <article className="flex w-full flex-col gap-8 pb-4">
          {/* 書名頁：封面在左，右邊一條垂直線隔開書名與所有欄位 */}
          {/* 不設 items-start，右欄才會被拉到跟封面一樣高，那條垂直線就不會半途斷掉 */}
          <header className="flex gap-4 md:gap-6">
            <Cover url={book.coverUrl} title={book.title} />
            <div className="flex min-w-0 flex-1 flex-col gap-4 border-l border-gray-200 pl-4 md:pl-6">
              <h2 className="text-xl leading-snug font-semibold break-words text-gray-900 md:text-2xl">
                {book.title}
              </h2>
              <BookFacts book={book} />
            </div>
          </header>

          {/* 書本身的事實在上面的書名頁；這一節以下全是我加上去的，用章節線隔開 */}
          <Section title="標記">
            <MyMarks book={book} />
          </Section>

          {keywords.length > 0 && (
            <Section title="關鍵字">
              <div className="flex flex-wrap items-center gap-1.5">
                {keywords.map((keyword) => (
                  <Link
                    key={keyword}
                    href={`/books?keyword=${encodeURIComponent(keyword)}`}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                  >
                    {keyword}
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {bookQuotes.length > 0 && (
            <Section title="佳句">
              <ul className="flex flex-col gap-5">
                {bookQuotes.map((row) => (
                  <QuoteItem key={row.id} quote={row} />
                ))}
              </ul>
            </Section>
          )}

          {bookVocabulary.length > 0 && (
            <Section title="單字">
              <ul className="flex flex-col gap-4">
                {bookVocabulary.map((row) => (
                  <VocabularyItem key={row.id} row={row} />
                ))}
              </ul>
            </Section>
          )}

          {note && (
            <Section title="心得">
              {/* 心得是這一頁唯一的長文，用襯線字與寬行距，看起來就是一段文章 */}
              {/* 只有這一段限行長：一行拉到整個寬螢幕會讀不下去，短欄位則沒這問題 */}
              <p className="max-w-3xl font-serif text-[15px] leading-[1.9] whitespace-pre-wrap text-gray-800 md:text-base">
                {note}
              </p>
            </Section>
          )}

          {relatedArticles.length > 0 && (
            <Section title="相關文章">
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
                      <span className="truncate">{articleTitles.get(url) ?? url}</span>
                      <ExternalLink size={12} strokeWidth={1.5} className="shrink-0" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </article>
      </PageBody>
    </>
  );
}
