"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarPlus,
  FileText,
  Languages,
  Link as LinkIcon,
  Newspaper,
  NotebookPen,
  Quote,
  Store,
  Tag,
  Type,
  type LucideIcon,
} from "lucide-react";
import { PageMessage } from "@/components/layout/PageMessage";
import { TagList as OptionList } from "@/components/ui/TagBadge";
import { instapaperReadUrl } from "@/lib/instapaper/readUrl";
import { useArticles } from "@/lib/useArticles";
import { useBooks } from "@/lib/useBooks";
import { useMounted } from "@/lib/useMounted";
import { useRecords } from "@/lib/useRecords";
import { useUrlParams } from "@/lib/useUrlParam";
import { isBookViewMode, useBookViewStore } from "@/store/useBookViewStore";
import { useSheetStore } from "@/store/useSheetStore";
import { Book, formatCount, ReadingStatus, splitLines } from "@/types/book";
import { QuoteRow } from "@/types/record";
import { NotesDialog } from "./NotesDialog";

/** width：表格列不需要看清楚封面，小一點可以讓書名多拿一些寬度 */
function Cover({ url, title, width = "w-10" }: { url: string; title: string; width?: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        className={`aspect-2/3 rounded-sm object-cover shadow ring-1 ring-black/10 ${width}`}
      />
    );
  }
  return (
    <div
      className={`flex aspect-2/3 items-center justify-center rounded-sm bg-gray-100 text-[10px] leading-tight text-gray-400 ${width}`}
    >
      {title.slice(0, 2) || "—"}
    </div>
  );
}

/** 書封牆用的大書封，沒有書封時退回書名色塊，避免整面出現空洞 */
function LargeCover({ url, title }: { url: string; title: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        className="aspect-2/3 w-full rounded object-cover shadow ring-1 ring-black/10 transition group-hover:shadow-md"
      />
    );
  }
  return (
    <div className="flex aspect-2/3 w-full items-center justify-center rounded bg-gray-100 p-2 text-center text-xs leading-snug text-gray-400">
      {title.slice(0, 12) || "—"}
    </div>
  );
}

const STATUS_STYLES: Record<ReadingStatus, string> = {
  想讀: "bg-[#EAE3D8] text-[#5C4A3D]",
  閱讀中: "bg-[#DCE6F1] text-[#2B5A8E]",
  // 已讀完是多數狀態，給顏色只會讓整張表變花；灰色＝「這件事結束了」
  已讀完: "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: ReadingStatus }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[11px] whitespace-nowrap ${STATUS_STYLES[status] ?? STATUS_STYLES.想讀}`}
    >
      {status}
    </span>
  );
}

/**
 * 詳細檢視的一格：圖示代替欄位名稱，省下一整行文字。
 *
 * 圖示只用在語意明確的欄位（日期、頁數、平台…），tooltip 補上名稱；
 * 領域與屬性沒有公認的圖示，那兩格直接不放標題——彩色標籤本身就看得懂。
 */
function DetailField({
  Icon,
  label,
  children,
}: {
  Icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  // 空的就整格不畫。留一排「—」只是把卡片撐高，沒有告訴讀者任何事
  if (children === "" || children === null || children === undefined) return null;

  const isText = typeof children === "string" || typeof children === "number";
  return (
    <div className="flex min-w-0 items-center gap-1.5" title={label}>
      <Icon size={13} strokeWidth={1.5} className="shrink-0 text-gray-400" aria-hidden />
      <div className={`min-w-0 text-xs text-gray-700 md:text-sm ${isText ? "truncate" : ""}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * 心得與佳句在卡片上只露一行預覽，點了開彈出視窗看全文。
 *
 * 直接展開會把卡片撐得比其他張高好幾倍，一頁放得下幾張也跟著跳動。
 */
function NotesPreview({ book, quotes }: { book: Book; quotes: QuoteRow[] }) {
  const [open, setOpen] = useState<"note" | "quotes" | null>(null);
  const note = book.note.trim();
  const firstQuote = quotes[0]?.text ?? "";

  // 兩邊都沒東西就整塊不畫，不要留兩個空框把卡片撐高
  if (!note && !firstQuote) return null;

  return (
    <>
      {/* 兩個各自獨立的按鈕：點心得只看心得、點佳句只看佳句 */}
      <div className="grid grid-cols-2 gap-2">
        {note && (
          <PreviewButton
            Icon={NotebookPen}
            label="心得"
            text={note}
            onOpen={() => setOpen("note")}
          />
        )}
        {firstQuote && (
          <PreviewButton
            Icon={Quote}
            label="佳句"
            text={firstQuote}
            extra={quotes.length > 1 ? `${quotes.length} 句` : undefined}
            onOpen={() => setOpen("quotes")}
          />
        )}
      </div>

      {open && (
        <NotesDialog
          title={book.title}
          note={book.note}
          quotes={quotes}
          show={open}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

/** 有內容才會被畫出來，所以這裡不必處理空的情況 */
function PreviewButton({
  Icon,
  label,
  text,
  extra,
  onOpen,
}: {
  Icon: LucideIcon;
  label: string;
  text: string;
  extra?: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={(e) => {
        // 卡片本身會進編輯頁，這裡只開視窗
        e.stopPropagation();
        onOpen();
      }}
      /* 白底＋細框：卡片列本身的底色會在白、灰、hover 之間變，
         用灰底的話 hover 時就跟背景撞在一起看不見了 */
      className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded bg-white px-2 py-1 text-left ring-1 ring-gray-200 hover:ring-gray-400"
    >
      <Icon size={13} strokeWidth={1.5} className="shrink-0 text-gray-400" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-xs text-gray-600 md:text-sm">{text}</span>
      {extra && <span className="shrink-0 text-[11px] text-gray-400">{extra}</span>}
    </button>
  );
}

/**
 * 詳細卡片的封面：跟著卡片一樣高（h-full），但不超過 168px，
 * 免得欄位少的時候封面自己撐出一張巨大的圖。
 */
function DetailCover({ url, title }: { url: string; title: string }) {
  // 手機的卡片矮很多，封面也跟著壓低，才不會把欄位擠成細長條
  const shape =
    "aspect-2/3 h-full max-h-[84px] w-auto shrink-0 rounded object-cover shadow ring-1 ring-black/10 md:max-h-[168px]";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" loading="lazy" className={shape} />
    );
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
 * 一本書一張橫式卡片，Sheet 上的每個欄位都看得到，不用點進編輯頁。
 *
 * 用 grid 排版，手機與桌機只差在封面跨幾列：
 *   手機   封面｜標題區        桌機   封面｜標題區
 *          欄位（整列）              封面｜欄位
 */
function DetailCard({
  book,
  href,
  number,
  onOpen,
  tone,
  articleTitles,
  quotes,
}: {
  book: Book;
  href: string;
  number?: number;
  onOpen: (href: string) => void;
  tone: string;
  /** Instapaper 網址 → 標題；沒抓到就顯示網址本身 */
  articleTitles: Map<string, string>;
  /** 這本書在佳句分頁裡的那幾列 */
  quotes: QuoteRow[];
}) {
  return (
    // 卡片本身不是 <a>：來源網址要能獨立點開，連結不能巢狀在連結裡
    <div
      role="link"
      tabIndex={0}
      onClick={() => onOpen(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(href);
      }}
      className={`grid cursor-pointer grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 p-2.5 md:gap-x-4 md:gap-y-3 md:p-4 ${tone}`}
    >
      {/* 桌機：封面跨滿右邊三列（標題／欄位／心得佳句） */}
      <div className="row-start-1 md:row-span-3">
        <DetailCover url={book.coverUrl} title={book.title} />
      </div>

      {/* 書名與作者當成標題區，省下兩個欄位格 */}
      {/* 桌機：標題區壓低一點，右欄的總高才貼得住封面 */}
      <div className="col-start-2 flex min-w-0 flex-col gap-1 self-center md:self-start">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 truncate text-sm font-semibold md:text-base">{book.title}</span>
          {number !== undefined && (
            <span className="text-xs text-gray-400 tabular-nums">#{number}</span>
          )}
          <StatusBadge status={book.status} />
        </div>
        {/* 作者與出版社併成一行，兩邊都太長時各自截斷 */}
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
          <span className="min-w-0 truncate">{book.author || "—"}</span>
          {book.publisher && (
            <>
              <span className="shrink-0 text-gray-300">｜</span>
              <span className="min-w-0 truncate">{book.publisher}</span>
            </>
          )}
        </div>
      </div>

      {/*
        欄位排成會換行的一排，而不是固定格線：空欄位已經整格不畫，
        用格線的話那些洞會留在原地，卡片看起來又空又長。
      */}
      <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 md:col-span-1 md:col-start-2">
        {book.platform && (
          <DetailField Icon={Store} label="平台">
            <OptionList values={[book.platform]} />
          </DetailField>
        )}
        <DetailField Icon={Languages} label="語言">
          {book.language}
        </DetailField>
        <DetailField Icon={CalendarPlus} label="開始日期">
          {book.startDate}
        </DetailField>
        <DetailField Icon={CalendarCheck} label="完成日期">
          {book.endDate}
        </DetailField>
        <DetailField Icon={FileText} label="頁數">
          {formatCount(book.pageCount)}
        </DetailField>
        <DetailField Icon={Type} label="字數">
          {formatCount(book.wordCount)}
        </DetailField>
        {/* 領域、次領域與屬性不放標題，彩色標籤自己說話 */}
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <OptionList values={[book.domain, book.subDomain]} />
          <OptionList values={[book.type]} outline />
        </div>

        {book.sourceUrl && (
          <DetailField Icon={LinkIcon} label="來源網址">
            <a
              href={book.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={book.sourceUrl}
              // 網址又長又不重要，給它一個上限，別讓它吃掉整行
              className="block max-w-48 truncate text-blue-700 underline underline-offset-2 hover:text-blue-900"
            >
              {book.sourceUrl}
            </a>
          </DetailField>
        )}
      </div>

      {splitLines(book.keywords).length > 0 && (
        <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-1.5 md:col-span-1 md:col-start-2">
          <Tag size={13} strokeWidth={1.5} className="shrink-0 text-gray-400" />
          {splitLines(book.keywords).map((keyword) => (
            <Link
              key={keyword}
              href={`/books?keyword=${encodeURIComponent(keyword)}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600 hover:bg-gray-200"
            >
              {keyword}
            </Link>
          ))}
        </div>
      )}

      {splitLines(book.relatedArticles).length > 0 && (
        <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 md:col-span-1 md:col-start-2">
          <Newspaper size={13} strokeWidth={1.5} className="shrink-0 text-gray-400" />
          {splitLines(book.relatedArticles).map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={url}
              className="min-w-0 truncate text-[11px] text-blue-700 underline underline-offset-2 hover:text-blue-900"
            >
              {articleTitles.get(url) ?? url}
            </a>
          ))}
        </div>
      )}

      <div className="col-span-2 md:col-span-1 md:col-start-2">
        <NotesPreview book={book} quotes={quotes} />
      </div>
    </div>
  );
}

/** 目前篩選中的關鍵字。放在清單上方，因為它會改變下面看到的是什麼 */
function KeywordFilter({
  keyword,
  count,
  onClear,
}: {
  keyword: string;
  count: number;
  onClear: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
      <Tag size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
      <span className="font-medium">{keyword}</span>
      <span className="text-xs text-gray-400">{count} 本</span>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
      >
        清除
      </button>
    </div>
  );
}

/**
 * 每一列的底色：依完成年份交錯，今年白底、去年灰底、前年又回到白底……
 * 灰色沿用日曆「非本月」那格的底色，整個 app 只有一組次要底色。
 */
function rowTone(endDate: string | null, thisYear: number): string {
  const year = endDate ? Number(endDate.slice(0, 4)) : thisYear;
  const distance = Number.isNaN(year) ? 0 : Math.abs(thisYear - year);
  return distance % 2 === 1 ? "bg-gray-100 hover:bg-gray-200" : "bg-white hover:bg-gray-50";
}

/** 書封牆用的狀態標記：壓在封面左上角的小標籤，白邊讓它在任何封面上都看得見 */
function StatusDot({ status }: { status: ReadingStatus }) {
  if (status === "已讀完") return null;
  return (
    <span
      className={`absolute top-1 left-1 rounded px-1 py-px text-[10px] leading-4 ring-2 ring-white ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

/**
 * 還沒讀完的書在最左邊加一條色帶。
 *
 * 鋪滿整列的底色太髒，而且會跟年度交錯打架；細色條面積小、不干擾內容，
 * 但垂直掃一眼就看得到「未讀區」的邊界到哪裡。
 */
/**
 * 表格用的色條顏色：畫成絕對定位的一條，不佔版面寬度。
 * 用該狀態徽章的底色，色條與徽章才是同一件事的兩種畫法。
 */
function accentColor(status: ReadingStatus): string | null {
  if (status === "想讀") return "#EAE3D8";
  if (status === "閱讀中") return "#DCE6F1";
  return null;
}

function statusAccent(status: ReadingStatus): string {
  if (status === "想讀") return "border-l-[3px] border-l-[#EAE3D8]";
  if (status === "閱讀中") return "border-l-[3px] border-l-[#DCE6F1]";
  return "border-l-[3px] border-l-transparent";
}

/**
 * 只有「已讀完」的書有編號：編號代表「讀完的第幾本」，想讀與閱讀中還沒讀完，
 * 給了號碼反而看不出順序。清單本來就已排序，這裡照順序由大到小配號。
 */
function completionNumbers(books: Book[]): Map<string, number> {
  const done = books.filter((b) => b.status === "已讀完");
  const numbers = new Map<string, number>();
  done.forEach((b, i) => numbers.set(b.id, done.length - i));
  return numbers;
}

export function BookTable() {
  const router = useRouter();
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { books: allBooks, isLoading, error } = useBooks();
  const numbers = useMemo(() => completionNumbers(allBooks), [allBooks]);
  const thisYear = new Date().getFullYear();
  const { searchParams, setParams } = useUrlParams();
  const { view: savedView } = useBookViewStore();
  // 檢視方式以網址為準，重新整理或分享連結才回得到同一個畫面
  const urlView = searchParams.get("view");
  const view = isBookViewMode(urlView) ? urlView : savedView;
  // 反查：帶著 ?keyword= 就只看提到這個關鍵字的書
  const keyword = searchParams.get("keyword") ?? "";
  const books = keyword
    ? allBooks.filter((b) => splitLines(b.keywords).includes(keyword))
    : allBooks;
  const clearKeyword = () => setParams({ keyword: null });
  // 相關文章存的是網址，標題從已經抓下來的 Instapaper 清單對回去。
  // 兩種網址都收：使用者可能貼 Instapaper 的閱讀頁，也可能貼原文網址。
  // 對不到（沒連 Instapaper、文章已刪）就顯示網址本身，不會壞。
  const { articles } = useArticles();
  // 佳句在自己的分頁裡，先按書分好組再發給每一張卡片
  const { quotes } = useRecords();
  const quotesByBook = new Map<string, QuoteRow[]>();
  for (const row of quotes) {
    const list = quotesByBook.get(row.bookId);
    if (list) list.push(row);
    else quotesByBook.set(row.bookId, [row]);
  }
  const articleTitles = new Map<string, string>();
  for (const a of articles) {
    const title = a.title || a.url;
    if (a.url) articleTitles.set(a.url, title);
    articleTitles.set(instapaperReadUrl(a.bookmark_id, a.url), title);
  }
  // 帶著目前的檢視進編輯頁，存檔後才回得到同一個畫面
  const query = searchParams.toString();
  const editHref = (id: string) =>
    `/books/${id}/edit${query ? `?back=${encodeURIComponent(query)}` : ""}`;

  // 還沒掛載完就什麼都別說，免得閃一下「請先連接」
  if (!mounted) return null;

  if (!sheetId) {
    return <PageMessage>請先到「設定」頁面連接 Google Sheet</PageMessage>;
  }

  if (isLoading) {
    return <PageMessage>載入中…</PageMessage>;
  }

  if (error) {
    return <PageMessage tone="error">{error}</PageMessage>;
  }

  if (books.length === 0) {
    return (
      <div className="flex w-full flex-col gap-3">
        {keyword && <KeywordFilter keyword={keyword} count={0} onClear={clearKeyword} />}
        <PageMessage>{keyword ? "沒有書提到這個關鍵字" : "尚未新增任何書籍"}</PageMessage>
      </div>
    );
  }

  if (view === "detail") {
    return (
      <div>
        {/* 詳細檢視：一本一張橫式卡片，欄位全開，所以一頁只放得下兩三本 */}
        {/* 間距放在每一列內部，不用 gap——有縫的話年度底色就連不起來 */}
        <ul className="overflow-hidden rounded-lg border bg-white">
          {books.map((b, i) => (
            <li key={b.id || `detail-${i}`} className="border-t first:border-t-0">
              <DetailCard
                book={b}
                href={editHref(b.id)}
                number={numbers.get(b.id)}
                onOpen={router.push}
                tone={`${rowTone(b.endDate, thisYear)} ${statusAccent(b.status)}`}
                articleTitles={articleTitles}
                quotes={quotesByBook.get(b.id) ?? []}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (view === "card") {
    return (
      <div>
        {/* 書封牆：一次看到很多本、也看得清楚封面，只留書名與完讀日期 */}
        <div className="rounded-lg border bg-white p-3">
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] md:grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]">
            {books.map((b, i) => (
              <li
                key={b.id || `cover-${i}`}

                className={`p-1.5 ${rowTone(b.endDate, thisYear)}`}
              >
                {/* 書封、書名、日期三層都靠 gap 分開，卡片高度固定不隨書名長短跳動 */}
                <Link href={editHref(b.id)} className="group flex flex-col gap-1">
                  {/* 書封牆是一整面圖，左側色條會把版面切得很碎，改成封面角落的小圓點 */}
                  <div className="relative">
                    <LargeCover url={b.coverUrl} title={b.title} />
                    <StatusDot status={b.status} />
                  </div>
                  <p className="truncate text-xs leading-snug font-medium">{b.title}</p>
                  <p className="truncate text-[10px] text-gray-400">
                    {b.endDate ? `${b.endDate} 讀完` : b.status}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {keyword && <KeywordFilter keyword={keyword} count={books.length} onClear={clearKeyword} />}

      {/* 手機版：卡片列表，欄位太多的表格在小螢幕上不好讀 */}
      <div className="overflow-hidden rounded-lg border bg-white md:hidden">
        <ul className="divide-y">
          {books.map((b, i) => (
            <li key={b.id || `card-${i}`}>
              <Link
                href={editHref(b.id)}
                className={`flex gap-3 p-3 ${rowTone(b.endDate, thisYear)} ${statusAccent(b.status)}`}
              >
                <Cover url={b.coverUrl} title={b.title} width="w-8" />
                {/*
                  手機一列只留兩行：書名，以及「狀態＋作者＋日期」。
                  標籤留給卡片與詳細檢視——在這裡塞滿只會讓每一列長到一頁放不了幾本。
                */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-sm font-medium">
                    {numbers.has(b.id) && (
                      <span className="mr-2 text-xs text-gray-400 tabular-nums">
                        #{numbers.get(b.id)}
                      </span>
                    )}
                    {b.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <StatusBadge status={b.status} />
                    <span className="min-w-0 flex-1 truncate text-gray-500">{b.author}</span>
                    <span className="shrink-0 tabular-nums">{b.endDate ?? b.startDate ?? "—"}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden w-full overflow-hidden rounded-lg border bg-white md:block">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-gray-100 text-left">
            {/* 欄寬用百分比，次要欄位隨螢幕變窄逐一收起，才不會撐出橫向捲軸 */}
            <tr>
              <th className="w-[6%] px-3 py-2 whitespace-nowrap">封面</th>
              {/* 書名字級縮小後空間變多，日期與分類可以提早出現 */}
              <th className="w-[26%] px-3 py-2 whitespace-nowrap">書名</th>
              <th className="w-[13%] px-3 py-2 whitespace-nowrap">作者</th>
              <th className="w-[9%] px-3 py-2 whitespace-nowrap">狀態</th>
              <th className="hidden w-[10%] px-3 py-2 whitespace-nowrap lg:table-cell">平台</th>
              <th className="hidden w-[10%] px-3 py-2 whitespace-nowrap xl:table-cell">開始日期</th>
              <th className="hidden w-[10%] px-3 py-2 whitespace-nowrap lg:table-cell">完成日期</th>
              <th className="hidden w-[10%] px-3 py-2 whitespace-nowrap lg:table-cell">領域</th>
              <th className="hidden w-[10%] px-3 py-2 whitespace-nowrap xl:table-cell">屬性</th>
              <th className="hidden w-[6%] px-3 py-2 whitespace-nowrap 2xl:table-cell">語言</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b, i) => (
              // 整列點擊就進編輯頁，所以書名不再另外做成連結樣式
              <tr
                key={b.id || `row-${i}`}

                onClick={() => router.push(editHref(b.id))}
                className={`cursor-pointer border-t ${rowTone(b.endDate, thisYear)}`}
              >
                {/*
                狀態色條疊在第一格上，不用 border-l——那會把整個 tbody 往右推 3px，
                表頭得跟著補一條透明的才對得齊，是很容易再壞掉的做法。
              */}
                <td className="relative px-3 py-2">
                  {accentColor(b.status) && (
                    <span
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{ background: accentColor(b.status) ?? undefined }}
                    />
                  )}
                  <Cover url={b.coverUrl} title={b.title} width="w-7" />
                </td>
                <td className="max-w-0 overflow-hidden px-3 py-2 align-middle">
                  {/* 編號與書名是同一塊，一起垂直置中；沒有編號時那一行就不存在 */}
                  <div className="flex flex-col justify-center">
                    {numbers.has(b.id) && (
                      <span className="text-[11px] leading-4 text-gray-400 tabular-nums">
                        #{numbers.get(b.id)}
                      </span>
                    )}
                    {/* 書名至少要跟其他欄位一樣大（表格是 text-sm），再小就變成次要資訊了 */}
                    <span className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap">
                      {b.title}
                    </span>
                  </div>
                </td>
                <td className="max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                    {b.author}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <StatusBadge status={b.status} />
                </td>
                <td className="hidden px-3 py-2 lg:table-cell">
                  <OptionList values={[b.platform]} />
                </td>
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap xl:table-cell">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                    {b.startDate ?? "—"}
                  </span>
                </td>
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap lg:table-cell">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                    {b.endDate ?? "—"}
                  </span>
                </td>
                <td className="hidden px-3 py-2 lg:table-cell">
                  <OptionList values={[b.domain]} />
                </td>
                <td className="hidden px-3 py-2 xl:table-cell">
                  <OptionList values={[b.type]} outline />
                </td>
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap 2xl:table-cell">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                    {b.language}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 翻頁列放在框外，跟詳細檢視一致 */}
    </div>
  );
}
