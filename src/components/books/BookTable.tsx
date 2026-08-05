"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PagerButton } from "@/components/ui/PagerButton";
import { useUrlParams } from "@/lib/useUrlParam";
import { isBookViewMode, useBookViewStore } from "@/store/useBookViewStore";
import { usePagingMode } from "@/lib/usePagingMode";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";
import { useFitPageSize, useFitRowsByMeasure, viewportBottom } from "@/lib/useFitPageSize";
import { ChevronDown } from "lucide-react";
import { TagList as OptionList } from "@/components/ui/TagBadge";
import { Book, ReadingStatus } from "@/types/book";

/** 單筆高度：手機是卡片，桌機是含書封的表格列 */
const ROW_HEIGHT = { mobile: 86, desktop: 68 };

/** 詳細檢視一張卡片就攤開所有欄位，高度自然高得多 */
const DETAIL_ROW_HEIGHT = { mobile: 175, desktop: 200 };

/** 書封牆的單張卡片尺寸，用來推算一頁排得下幾張 */
const CARD_SIZE = {
  mobile: { width: 72, height: 134 },
  desktop: { width: 90, height: 164 },
};

/**
 * 書封牆一頁放幾本：橫向看容器寬度排得下幾張，縱向看畫面剩多少高度，
 * 一樣維持「剛好塞滿一畫面、不用捲動」的翻頁節奏。
 */
function useFitCardCount(ref: RefObject<HTMLElement | null>, reserved = 96): number {
  const [count, setCount] = useState(12);

  useEffect(() => {
    function recalc() {
      const el = ref.current;
      if (!el) return;

      const isMobile = window.innerWidth < 768;
      const card = isMobile ? CARD_SIZE.mobile : CARD_SIZE.desktop;
      const top = el.getBoundingClientRect().top;

      const columns = Math.max(2, Math.floor(el.clientWidth / card.width));
      const rows = Math.max(1, Math.floor((viewportBottom(el) - top - reserved) / card.height));
      setCount(columns * rows);
    }

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  });

  return count;
}

/** width：表格列不需要看清楚封面，小一點可以讓書名多拿一些寬度 */
function Cover({ url, title, width = "w-10" }: { url: string; title: string; width?: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        className={`aspect-2/3 rounded-sm object-cover shadow-sm ${width}`}
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
        className="aspect-2/3 w-full rounded object-cover shadow-sm transition group-hover:shadow-md"
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
  想讀: "bg-gray-100 text-gray-600",
  閱讀中: "bg-blue-50 text-blue-800",
  已讀完: "bg-green-50 text-green-800",
};

function StatusBadge({ status }: { status: ReadingStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] ${STATUS_STYLES[status] ?? STATUS_STYLES.想讀}`}
    >
      {status}
    </span>
  );
}

/**
 * 詳細檢視的一格：欄位名稱小、值大，沒填的一律顯示破折號才對得整齊。
 *
 * truncate 只給純文字用——標籤徽章的外框是 ring，畫在邊界外面，
 * 套上 overflow-hidden 會被削掉一圈。
 */
function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  const isText = typeof children === "string" || typeof children === "number";
  return (
    <div className="flex min-w-0 flex-col gap-0.5 md:gap-1">
      <p className="text-[11px] leading-4 text-gray-400 md:text-xs">{label}</p>
      <div className={`text-xs text-gray-700 md:text-sm ${isText ? "truncate" : ""}`}>
        {children || "—"}
      </div>
    </div>
  );
}

/**
 * 筆記預設只露一行，太長會把卡片撐得比其他張高很多。
 *
 * 展開鍵只在文字真的被截掉時才出現——只有一行的筆記給一顆按鈕，
 * 按下去什麼都不會變，反而讓人困惑。是否溢出得渲染後量才知道。
 */
function Note({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const measure = () => {
      // 展開狀態下量不到截斷與否，先維持上一次的結果
      if (expanded) return;
      setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    // 整塊筆記都不觸發卡片的點擊：想展開／想選取文字時不該被帶去編輯頁
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-start gap-2 rounded bg-gray-50 px-2 py-1"
    >
      <p
        ref={textRef}
        /* whitespace-pre-wrap：筆記裡的換行照原樣顯示，不要被折成一整段 */
        className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-xs text-gray-600 md:text-sm ${
          expanded ? "" : "line-clamp-1"
        }`}
      >
        {text}
      </p>

      {(overflowing || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "收合筆記" : "展開筆記"}
          aria-expanded={expanded}
          className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
        >
          <ChevronDown
            size={14}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}

/**
 * 詳細卡片的封面：跟著卡片一樣高（h-full），但不超過 168px，
 * 免得欄位少的時候封面自己撐出一張巨大的圖。
 */
function DetailCover({ url, title }: { url: string; title: string }) {
  // 手機的卡片矮很多，封面也跟著壓低，才不會把欄位擠成細長條
  const shape =
    "aspect-2/3 h-full max-h-[84px] w-auto shrink-0 rounded object-cover shadow-sm md:max-h-[168px]";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" loading="lazy" className={shape} />
    );
  }
  return (
    <div className={`${shape} flex items-center justify-center bg-gray-100 p-2 text-center text-xs leading-snug text-gray-400`}>
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
}: {
  book: Book;
  href: string;
  number?: number;
  onOpen: (href: string) => void;
  tone: string;
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
      <div className="row-start-1 md:row-span-2">
        <DetailCover url={book.coverUrl} title={book.title} />
      </div>

      {/* 書名與作者當成標題區，省下兩個欄位格 */}
      <div className="col-start-2 flex min-w-0 flex-col gap-0.5 self-center md:self-start">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 truncate text-sm font-semibold md:text-lg">
            {book.title}
          </span>
          {number !== undefined && (
            <span className="text-xs tabular-nums text-gray-400">#{number}</span>
          )}
          <StatusBadge status={book.status} />
        </div>
        {/* 作者與出版社併成一行，兩邊都太長時各自截斷 */}
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500 md:text-sm">
          <span className="min-w-0 truncate">{book.author || "—"}</span>
          {book.publisher && (
            <>
              <span className="shrink-0 text-gray-300">｜</span>
              <span className="min-w-0 truncate">{book.publisher}</span>
            </>
          )}
        </div>
      </div>

      {/* 手機欄位多會太擠，只留兩欄；桌機接在標題下面、與封面並排 */}
      <div className="col-span-2 grid grid-cols-3 gap-x-3 gap-y-1.5 md:col-span-1 md:col-start-2 md:gap-x-4 md:gap-y-3 lg:grid-cols-5">
        <DetailField label="平台">
          <OptionList values={[book.platform]} />
        </DetailField>
        <DetailField label="語言">{book.language}</DetailField>
        <DetailField label="開始日期">{book.startDate}</DetailField>
        <DetailField label="完成日期">{book.endDate}</DetailField>
        <DetailField label="頁數">{book.pageCount}</DetailField>
        <DetailField label="字數">{book.wordCount}</DetailField>
        <DetailField label="領域">
          <OptionList values={[book.domain]} />
        </DetailField>
        <DetailField label="屬性">
          <OptionList values={[book.type]} size="sm" />
        </DetailField>
        <DetailField label="來源網址">
          {book.sourceUrl ? (
            <a
              href={book.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={book.sourceUrl}
              className="block truncate text-blue-700 underline underline-offset-2 hover:text-blue-900"
            >
              {book.sourceUrl}
            </a>
          ) : (
            ""
          )}
        </DetailField>
      </div>

      {book.note && (
        <div className="col-span-2 md:col-span-1 md:col-start-2">
          <Note text={book.note} />
        </div>
      )}
    </div>
  );
}

/**
 * 年度交錯底色：今年是白底，去年是灰底，前年又回到白底……
 *
 * 灰色沿用日曆「非本月」那格的底色，整個 app 只有一組「次要底色」。
 * 還沒讀完的書沒有年份可分，一律當成今年。
 */
function yearTone(endDate: string | null, thisYear: number): string {
  const year = endDate ? Number(endDate.slice(0, 4)) : thisYear;
  const distance = Number.isNaN(year) ? 0 : Math.abs(thisYear - year);
  return distance % 2 === 1
    ? "bg-gray-100 hover:bg-gray-200"
    : "bg-white hover:bg-gray-50";
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
  const { books, isLoading, error } = useBooks();
  const numbers = useMemo(() => completionNumbers(books), [books]);
  const thisYear = new Date().getFullYear();
  const { searchParams, setParams } = useUrlParams();
  const { view: savedView } = useBookViewStore();
  // 檢視方式與頁碼都以網址為準，重新整理或分享連結才回得到同一個畫面
  const urlView = searchParams.get("view");
  const view = isBookViewMode(urlView) ? urlView : savedView;
  const { scrolling } = usePagingMode();
  const page = Math.max(0, (Number(searchParams.get("page")) || 1) - 1);
  const setPage = (next: number) => setParams({ page: next === 0 ? null : String(next + 1) });
  // 帶著目前的檢視與頁碼進編輯頁，存檔後才回得到同一頁
  const query = searchParams.toString();
  const editHref = (id: string) => `/books/${id}/edit${query ? `?back=${encodeURIComponent(query)}` : ""}`;
  const containerRef = useRef<HTMLDivElement>(null);
  // 詳細卡片很高，手機一頁可能只放得下一張，下限放寬到 1
  const minRows = view === "detail" ? 1 : 3;
  const rowEstimate = useFitPageSize(
    containerRef,
    view === "detail" ? DETAIL_ROW_HEIGHT : ROW_HEIGHT,
    96,
    minRows,
  );
  const cardEstimate = useFitCardCount(containerRef);
  // 各種檢視都先估、再依實際渲染高度修正。書封的高度會隨書名行數變動，
  // 純算常數一定有誤差，量測才保證不會溢出畫面。
  // 捲動模式不需要「剛好一畫面」，量測直接關掉。
  const fitPageSize = useFitRowsByMeasure(
    containerRef,
    view === "card" ? cardEstimate : rowEstimate,
    books.length,
    !scrolling,
    minRows,
  );

  // 捲動模式：一次全部列出來，等於只有一頁
  const pageSize = scrolling ? Math.max(1, books.length) : fitPageSize;
  const pageCount = Math.max(1, Math.ceil(books.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageBooks = books.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  if (!sheetId) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        請先到「設定」頁面連接 Google Sheet
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        載入中…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        尚未新增任何書籍
      </div>
    );
  }

  const pager =
    pageCount > 1 ? (
      <div className="mt-2 flex items-center justify-center gap-4 p-2">
        <PagerButton
          direction="prev"
          onClick={() => setPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          label="上一頁"
        />
        <span className="whitespace-nowrap text-xs text-gray-500">
          第 {currentPage + 1} / {pageCount} 頁
        </span>
        <PagerButton
          direction="next"
          onClick={() => setPage(Math.min(pageCount - 1, currentPage + 1))}
          disabled={currentPage === pageCount - 1}
          label="下一頁"
        />
      </div>
    ) : null;

  if (view === "detail") {
    return (
      <div ref={containerRef}>
        {/* 詳細檢視：一本一張橫式卡片，欄位全開，所以一頁只放得下兩三本 */}
        {/* 間距放在每一列內部，不用 gap——有縫的話年度底色就連不起來 */}
        <ul className="overflow-hidden rounded-lg border bg-white">
          {pageBooks.map((b, i) => (
            <li key={b.id || `detail-${i}`} data-fit-row className="border-t first:border-t-0">
              <DetailCard
                book={b}
                href={editHref(b.id)}
                number={numbers.get(b.id)}
                onOpen={router.push}
                tone={yearTone(b.endDate, thisYear)}
              />
            </li>
          ))}
        </ul>
        {pager}
      </div>
    );
  }

  if (view === "card") {
    return (
      <div ref={containerRef}>
        {/* 書封牆：一次看到很多本、也看得清楚封面，只留書名與完讀日期 */}
        <div className="rounded-lg border bg-white p-3">
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] md:grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]">
            {pageBooks.map((b, i) => (
              <li
                key={b.id || `cover-${i}`}
                data-fit-row
                className={`p-1.5 ${yearTone(b.endDate, thisYear)}`}
              >
                {/* 書封、書名、日期三層都靠 gap 分開，卡片高度固定不隨書名長短跳動 */}
                <Link href={editHref(b.id)} className="group flex flex-col gap-1">
                  <LargeCover url={b.coverUrl} title={b.title} />
                  <p className="truncate text-xs font-medium leading-snug">{b.title}</p>
                  <p className="truncate text-[10px] text-gray-400">
                    {b.endDate ? `${b.endDate} 讀完` : b.status}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {pager}
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {/* 手機版：卡片列表，欄位太多的表格在小螢幕上不好讀 */}
      <div className="overflow-hidden rounded-lg border bg-white md:hidden">
        <ul className="divide-y">
          {pageBooks.map((b, i) => (
            <li key={b.id || `card-${i}`} data-fit-row>
              <Link
                href={editHref(b.id)}
                className={`flex gap-3 p-3 ${yearTone(b.endDate, thisYear)}`}
              >
                <Cover url={b.coverUrl} title={b.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {numbers.has(b.id) && (
                      <span className="mr-2 text-xs tabular-nums text-gray-400">
                        #{numbers.get(b.id)}
                      </span>
                    )}
                    {b.title}
                  </p>
                  <p className="truncate text-xs text-gray-500">{b.author}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <StatusBadge status={b.status} />
                    <OptionList values={[b.platform, b.domain, b.type]} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {b.startDate ?? "—"} ～ {b.endDate ?? "—"}
                  </p>
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
            <th className="w-[6%] whitespace-nowrap px-3 py-2">封面</th>
            {/* 書名字級縮小後空間變多，日期與分類可以提早出現 */}
            <th className="w-[26%] whitespace-nowrap px-3 py-2">書名</th>
            <th className="w-[13%] whitespace-nowrap px-3 py-2">作者</th>
            <th className="w-[9%] whitespace-nowrap px-3 py-2">狀態</th>
            <th className="hidden w-[10%] whitespace-nowrap px-3 py-2 lg:table-cell">平台</th>
            <th className="hidden w-[10%] whitespace-nowrap px-3 py-2 xl:table-cell">開始日期</th>
            <th className="hidden w-[10%] whitespace-nowrap px-3 py-2 lg:table-cell">完成日期</th>
            <th className="hidden w-[10%] whitespace-nowrap px-3 py-2 lg:table-cell">領域</th>
            <th className="hidden w-[10%] whitespace-nowrap px-3 py-2 xl:table-cell">屬性</th>
            <th className="hidden w-[6%] whitespace-nowrap px-3 py-2 2xl:table-cell">語言</th>
          </tr>
        </thead>
        <tbody>
          {pageBooks.map((b, i) => (
            // 整列點擊就進編輯頁，所以書名不再另外做成連結樣式
            <tr
              key={b.id || `row-${i}`}
              data-fit-row
              onClick={() => router.push(editHref(b.id))}
              className={`cursor-pointer border-t ${yearTone(b.endDate, thisYear)}`}
            >
              <td className="px-3 py-2">
                <Cover url={b.coverUrl} title={b.title} width="w-7" />
              </td>
              <td className="max-w-0 overflow-hidden px-3 py-2 align-middle">
                {/* 編號與書名是同一塊，一起垂直置中；沒有編號時那一行就不存在 */}
                <div className="flex flex-col justify-center">
                  {numbers.has(b.id) && (
                    <span className="text-[11px] leading-4 tabular-nums text-gray-400">
                      #{numbers.get(b.id)}
                    </span>
                  )}
                  {/* 書名至少要跟其他欄位一樣大（表格是 text-sm），再小就變成次要資訊了 */}
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium">
                    {b.title}
                  </span>
                </div>
              </td>
              <td className="max-w-0 overflow-hidden whitespace-nowrap px-3 py-2">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.author}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <StatusBadge status={b.status} />
              </td>
              <td className="hidden px-3 py-2 lg:table-cell">
                <OptionList values={[b.platform]} />
              </td>
              <td className="hidden max-w-0 overflow-hidden whitespace-nowrap px-3 py-2 xl:table-cell">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.startDate ?? "—"}</span>
              </td>
              <td className="hidden max-w-0 overflow-hidden whitespace-nowrap px-3 py-2 lg:table-cell">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.endDate ?? "—"}</span>
              </td>
              <td className="hidden px-3 py-2 lg:table-cell">
                <OptionList values={[b.domain]} />
              </td>
              <td className="hidden px-3 py-2 xl:table-cell">
                <OptionList values={[b.type]} size="sm" />
              </td>
              <td className="hidden max-w-0 overflow-hidden whitespace-nowrap px-3 py-2 2xl:table-cell">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.language}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* 翻頁列放在框外，跟詳細檢視一致 */}
      {pager}
    </div>
  );
}
