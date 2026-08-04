"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefObject, useEffect, useRef, useState } from "react";
import { PagerButton } from "@/components/ui/PagerButton";
import { useUrlParams } from "@/lib/useUrlParam";
import { isBookViewMode, useBookViewStore } from "@/store/useBookViewStore";
import { usePagingMode } from "@/lib/usePagingMode";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";
import { useFitPageSize, useFitRowsByMeasure, viewportBottom } from "@/lib/useFitPageSize";
import { TagList as OptionList } from "@/components/ui/TagBadge";
import { Book, ReadingStatus } from "@/types/book";

/** 單筆高度：手機是卡片，桌機是含書封的表格列 */
const ROW_HEIGHT = { mobile: 86, desktop: 68 };

/** 詳細檢視一張卡片就攤開所有欄位，高度自然高得多 */
const DETAIL_ROW_HEIGHT = { mobile: 250, desktop: 210 };

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

function Cover({ url, title }: { url: string; title: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        className="aspect-2/3 w-10 rounded-sm object-cover shadow-sm"
      />
    );
  }
  return (
    <div className="flex aspect-2/3 w-10 items-center justify-center rounded-sm bg-gray-100 text-[11px] leading-tight text-gray-400">
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
    <div className="min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <div className={`text-sm text-gray-700 ${isText ? "truncate" : ""}`}>
        {children || "—"}
      </div>
    </div>
  );
}

/** 一本書一張橫式卡片，Sheet 上的每個欄位都看得到，不用點進編輯頁 */
function DetailCard({ book, href, number }: { book: Book; href: string; number: number }) {
  return (
    <Link
      href={href}
      className="flex gap-4 rounded-lg border bg-white p-3 hover:bg-gray-50 md:p-4"
    >
      {/* 寬度是 aspect-2/3 換算來的：高度各加約 4px */}
      <div className="w-[4.4rem] shrink-0 md:w-[5.4rem]">
        <LargeCover url={book.coverUrl} title={book.title} />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {/* 書名與作者當成標題區，省下兩個欄位格 */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 truncate text-lg font-semibold">{book.title}</span>
            <span className="text-xs tabular-nums text-gray-400">#{number}</span>
            <StatusBadge status={book.status} />
          </div>
          <p className="truncate text-sm text-gray-500">{book.author || "—"}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-5">
          <DetailField label="出版社">{book.publisher}</DetailField>
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
            {book.sourceUrl ? <span className="truncate">{book.sourceUrl}</span> : ""}
          </DetailField>
        </div>

        {book.note && (
          <p className="line-clamp-2 rounded bg-gray-50 px-2 py-1 text-sm text-gray-600">
            {book.note}
          </p>
        )}
      </div>
    </Link>
  );
}

export function BookTable() {
  const router = useRouter();
  const { sheetId } = useSheetStore();
  const { books, isLoading, error } = useBooks();
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
  const rowEstimate = useFitPageSize(
    containerRef,
    view === "detail" ? DETAIL_ROW_HEIGHT : ROW_HEIGHT,
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

  // 捲動模式下最底部要留白，不然最後一列會貼著畫面底緣
  const scrollPad = scrolling ? "pb-6" : "";

  if (view === "detail") {
    return (
      <div ref={containerRef} className={scrollPad}>
        {/* 詳細檢視：一本一張橫式卡片，欄位全開，所以一頁只放得下兩三本 */}
        <ul className="space-y-2">
          {pageBooks.map((b, i) => (
            <li key={b.id || `detail-${i}`} data-fit-row>
              <DetailCard
                book={b}
                href={editHref(b.id)}
                number={books.length - (currentPage * pageSize + i)}
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
      <div ref={containerRef} className={scrollPad}>
        {/* 書封牆：一次看到很多本、也看得清楚封面，只留書名與完讀日期 */}
        <div className="rounded-lg border bg-white p-3">
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] md:gap-2.5">
            {pageBooks.map((b, i) => (
              <li key={b.id || `cover-${i}`} data-fit-row>
                <Link href={editHref(b.id)} className="group block">
                  <LargeCover url={b.coverUrl} title={b.title} />
                  <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-snug">
                    {b.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {b.endDate ? `${b.endDate} 讀完` : b.status}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {pager}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={scrollPad}>
      {/* 手機版：卡片列表，欄位太多的表格在小螢幕上不好讀 */}
      <div className="overflow-hidden rounded-lg border bg-white md:hidden">
        <ul className="divide-y">
          {pageBooks.map((b, i) => (
            <li key={b.id || `card-${i}`} data-fit-row>
              <Link href={editHref(b.id)} className="flex gap-3 p-3 hover:bg-gray-50">
                <Cover url={b.coverUrl} title={b.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    <span className="mr-2 text-xs tabular-nums text-gray-400">
                      #{books.length - (currentPage * pageSize + i)}
                    </span>
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
        {pager}
      </div>

      <div className="hidden w-full overflow-hidden rounded-lg border bg-white md:block">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-gray-100 text-left">
          {/* 欄寬用百分比，次要欄位隨螢幕變窄逐一收起，才不會撐出橫向捲軸 */}
          <tr>
            <th className="w-[9%] whitespace-nowrap px-3 py-2">封面</th>
            {/* 少了操作欄，多出來的寬度給書名 */}
            <th className="w-[40%] whitespace-nowrap px-3 py-2">書名</th>
            <th className="w-[16%] whitespace-nowrap px-3 py-2">作者</th>
            <th className="w-[11%] whitespace-nowrap px-3 py-2">狀態</th>
            <th className="hidden w-[11%] whitespace-nowrap px-3 py-2 xl:table-cell">平台</th>
            <th className="hidden w-[11%] whitespace-nowrap px-3 py-2 2xl:table-cell">開始日期</th>
            <th className="hidden w-[11%] whitespace-nowrap px-3 py-2 lg:table-cell">完成日期</th>
            <th className="hidden w-[11%] whitespace-nowrap px-3 py-2 xl:table-cell">領域</th>
            <th className="hidden w-[9%] whitespace-nowrap px-3 py-2 2xl:table-cell">屬性</th>
            <th className="hidden w-[9%] whitespace-nowrap px-3 py-2 2xl:table-cell">語言</th>
          </tr>
        </thead>
        <tbody>
          {pageBooks.map((b, i) => (
            // 整列點擊就進編輯頁，所以書名不再另外做成連結樣式
            <tr
              key={b.id || `row-${i}`}
              data-fit-row
              onClick={() => router.push(editHref(b.id))}
              className="cursor-pointer border-t hover:bg-gray-50"
            >
              <td className="px-3 py-2">
                <Cover url={b.coverUrl} title={b.title} />
              </td>
              <td className="max-w-0 overflow-hidden px-3 py-2 font-medium">
                <div className="flex max-w-full items-center gap-2 overflow-hidden whitespace-nowrap">
                  <span className="shrink-0 text-xs tabular-nums text-gray-400">
                    #{books.length - (currentPage * pageSize + i)}
                  </span>
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
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
              <td className="hidden px-3 py-2 xl:table-cell">
                <OptionList values={[b.platform]} />
              </td>
              <td className="hidden max-w-0 overflow-hidden whitespace-nowrap px-3 py-2 2xl:table-cell">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.startDate ?? "—"}</span>
              </td>
              <td className="hidden max-w-0 overflow-hidden whitespace-nowrap px-3 py-2 lg:table-cell">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.endDate ?? "—"}</span>
              </td>
              <td className="hidden px-3 py-2 xl:table-cell">
                <OptionList values={[b.domain]} />
              </td>
              <td className="hidden px-3 py-2 2xl:table-cell">
                <OptionList values={[b.type]} size="sm" />
              </td>
              <td className="hidden max-w-0 overflow-hidden whitespace-nowrap px-3 py-2 2xl:table-cell">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.language}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        {pager}
      </div>
    </div>
  );
}
