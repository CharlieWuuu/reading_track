"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarCheck,
  CalendarPlus,
  ExternalLink,
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
import { TagList as OptionList } from "@/components/ui/TagBadge";
import { Book, formatCount, ReadingStatus, splitLines } from "@/types/book";
import { QuoteRow } from "@/types/record";
import { NotesDialog } from "./NotesDialog";

export const STATUS_STYLES: Record<ReadingStatus, string> = {
  想讀: "bg-[#EAE3D8] text-[#5C4A3D]",
  閱讀中: "bg-[#DCE6F1] text-[#2B5A8E]",
  // 已讀完是多數狀態，給顏色只會讓整張表變花；灰色＝「這件事結束了」
  已讀完: "bg-gray-100 text-gray-500",
};

export function StatusBadge({ status }: { status: ReadingStatus }) {
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
        // 卡片本身會進詳細頁，這裡只開視窗
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
 * 一本書一張橫式卡片，Sheet 上的每個欄位都看得到。
 *
 * 用 grid 排版，手機與桌機只差在封面跨幾列：
 *   手機   封面｜標題區        桌機   封面｜標題區
 *          欄位（整列）              封面｜欄位
 *
 * 沒有 onOpen 時（書籍詳細頁）整張卡片就不是連結，只是把資料攤開來看。
 */
export function BookDetailCard({
  book,
  href,
  number,
  onOpen,
  tone,
  articleTitles,
  quotes,
}: {
  book: Book;
  href?: string;
  number?: number;
  onOpen?: (href: string) => void;
  tone?: string;
  /** Instapaper 網址 → 標題；沒抓到就顯示網址本身 */
  articleTitles: Map<string, string>;
  /** 這本書在佳句分頁裡的那幾列 */
  quotes: QuoteRow[];
}) {
  const clickable = Boolean(onOpen && href);
  const open = () => {
    if (onOpen && href) onOpen(href);
  };

  return (
    // 卡片本身不是 <a>：來源網址要能獨立點開，連結不能巢狀在連結裡
    <div
      role={clickable ? "link" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? open : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter") open();
            }
          : undefined
      }
      className={`grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 p-2.5 md:gap-x-4 md:gap-y-2.5 md:p-4 ${clickable ? "cursor-pointer" : ""} ${tone ?? ""}`}
    >
      {/* 桌機：封面跨滿右邊兩列（標題／內容） */}
      <div className="row-start-1 md:row-span-2">
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
        內容分左右兩欄：左邊是短欄位（日期、頁數…），右邊是關鍵字、文章、心得佳句。
        短欄位擠在同一排會被長欄位推得參差不齊，長內容混進去又會把那排撐開。
      */}
      {/* 左欄裝的都是短欄位，只給它一小塊寬度，長內容才拿得到剩下的空間 */}
      <div className="col-span-2 grid min-w-0 grid-cols-1 gap-x-5 gap-y-2 md:col-span-1 md:col-start-2 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
        {/* 左欄的短欄位走兩格格線，圖示才會對齊成兩直排 */}
        <div className="grid min-w-0 grid-cols-2 items-center gap-x-3 gap-y-1.5 self-start">
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
          <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-1.5">
            <OptionList values={[book.domain, book.subDomain]} />
            <OptionList values={[book.type]} outline />
          </div>

          {book.sourceUrl && (
            <DetailField Icon={LinkIcon} label="來源網址">
              {/* 網址本身又長又不好認，只留「來源」兩個字，開新分頁的圖示說明它會跳走 */}
              <a
                href={book.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title={book.sourceUrl}
                className="inline-flex items-center gap-1 text-blue-700 underline underline-offset-2 hover:text-blue-900"
              >
                來源
                <ExternalLink size={12} strokeWidth={1.5} aria-hidden />
              </a>
            </DetailField>
          )}
        </div>

        {/* 右欄：三塊都是會換行的長內容，直接一塊疊一塊 */}
        <div className="flex min-w-0 flex-col gap-2 self-start md:border-l md:border-gray-100 md:pl-5">
          {splitLines(book.keywords).length > 0 && (
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
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
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
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

          <NotesPreview book={book} quotes={quotes} />
        </div>
      </div>
    </div>
  );
}
