"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Tag } from "lucide-react";
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
import { Book, ReadingStatus, splitLines } from "@/types/book";
import { QuoteRow } from "@/types/record";
import { BookDetailCard, StatusBadge, STATUS_STYLES } from "./BookDetailCard";

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
  // 帶著目前的檢視進詳細頁，一路傳到編輯頁，存檔後才回得到同一個畫面
  const query = searchParams.toString();
  const detailHref = (id: string) =>
    `/books/${id}${query ? `?back=${encodeURIComponent(query)}` : ""}`;

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
              <BookDetailCard
                book={b}
                href={detailHref(b.id)}
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
                <Link href={detailHref(b.id)} className="group flex flex-col gap-1">
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
                href={detailHref(b.id)}
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

                onClick={() => router.push(detailHref(b.id))}
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
