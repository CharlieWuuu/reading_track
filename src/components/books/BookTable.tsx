"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefObject, useEffect, useRef, useState } from "react";
import { useUrlParams } from "@/lib/useUrlParam";
import { useBookViewStore } from "@/store/useBookViewStore";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";
import { useFitPageSize, useFitRowsByMeasure, viewportBottom } from "@/lib/useFitPageSize";
import { ReadingStatus } from "@/types/book";

/** 單筆高度：手機是卡片，桌機是含書封的表格列 */
const ROW_HEIGHT = { mobile: 86, desktop: 68 };

/** 書封牆的單張卡片尺寸，用來推算一頁排得下幾張 */
const CARD_SIZE = {
  mobile: { width: 98, height: 178 },
  desktop: { width: 126, height: 224 },
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

const OPTION_BADGE_STYLES = [
  "bg-green-50 text-green-800 ring-1 ring-green-200",
  "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  "bg-lime-50 text-lime-800 ring-1 ring-lime-200",
  "bg-teal-50 text-teal-800 ring-1 ring-teal-200",
];

function OptionBadge({ value, index }: { value: string; index: number }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${OPTION_BADGE_STYLES[index % OPTION_BADGE_STYLES.length]}`}
    >
      {value}
    </span>
  );
}

function OptionList({ values }: { values: Array<string | undefined> }) {
  const items = values
    .flatMap((value) =>
      value
        ? value.split(/[｜|,]/).map((item) => item.trim())
        : [],
    )
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, index) => (
        <OptionBadge key={`${item}-${index}`} value={item} index={index} />
      ))}
    </div>
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
  const view = urlView === "card" || urlView === "table" ? urlView : savedView;
  const page = Math.max(0, (Number(searchParams.get("page")) || 1) - 1);
  const setPage = (next: number) => setParams({ page: next === 0 ? null : String(next + 1) });
  // 帶著目前的檢視與頁碼進編輯頁，存檔後才回得到同一頁
  const query = searchParams.toString();
  const editHref = (id: string) => `/books/${id}/edit${query ? `?back=${encodeURIComponent(query)}` : ""}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const rowEstimate = useFitPageSize(containerRef, ROW_HEIGHT);
  // 列表用估算值起頭、再依實際渲染高度修正；書封牆是格狀排列，維持純計算
  const rowPageSize = useFitRowsByMeasure(
    containerRef,
    rowEstimate,
    books.length,
    view !== "card",
  );
  const cardPageSize = useFitCardCount(containerRef);
  const pageSize = view === "card" ? cardPageSize : rowPageSize;

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
      // 間距由分隔線上下帶開，翻頁列本身不留左右 padding
      <div className="mt-2 flex items-center justify-center gap-4 border-t pt-2">
        <button
          onClick={() => setPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          aria-label="上一頁"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-gray-300 leading-none text-gray-400 hover:border-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-400"
        >
          ‹
        </button>
        <span className="whitespace-nowrap text-xs text-gray-500">
          第 {currentPage + 1} / {pageCount} 頁
        </span>
        <button
          onClick={() => setPage(Math.min(pageCount - 1, currentPage + 1))}
          disabled={currentPage === pageCount - 1}
          aria-label="下一頁"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-gray-300 leading-none text-gray-400 hover:border-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-400"
        >
          ›
        </button>
      </div>
    ) : null;

  if (view === "card") {
    return (
      <div ref={containerRef}>
        {/* 書封牆：一次看到很多本、也看得清楚封面，只留書名與完讀日期 */}
        <div className="rounded-lg border bg-white p-3">
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2.5 md:grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] md:gap-3">
            {pageBooks.map((b, i) => (
              <li key={b.id || `cover-${i}`}>
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
    <div ref={containerRef}>
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
              <td className="hidden max-w-0 overflow-hidden whitespace-nowrap px-3 py-2 xl:table-cell">
                <OptionList values={[b.platform]} />
              </td>
              <td className="hidden max-w-0 overflow-hidden whitespace-nowrap px-3 py-2 2xl:table-cell">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.startDate ?? "—"}</span>
              </td>
              <td className="hidden max-w-0 overflow-hidden whitespace-nowrap px-3 py-2 lg:table-cell">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.endDate ?? "—"}</span>
              </td>
              <td className="hidden max-w-0 overflow-hidden whitespace-nowrap px-3 py-2 xl:table-cell">
                <OptionList values={[b.domain]} />
              </td>
              <td className="hidden max-w-0 overflow-hidden whitespace-nowrap px-3 py-2 2xl:table-cell">
                <OptionList values={[b.type]} />
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
