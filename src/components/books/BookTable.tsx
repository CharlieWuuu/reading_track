"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";
import { useFitPageSize } from "@/lib/useFitPageSize";
import { ReadingStatus } from "@/types/book";

/** 單筆高度：手機是卡片，桌機是含書封的表格列 */
const ROW_HEIGHT = { mobile: 86, desktop: 68 };

function Cover({ url, title }: { url: string; title: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        className="h-14 w-10 rounded-sm object-cover shadow-sm"
      />
    );
  }
  return (
    <div className="flex h-14 w-10 items-center justify-center rounded-sm bg-gray-100 text-[9px] leading-tight text-gray-400">
      {title.slice(0, 2) || "—"}
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

export function BookTable() {
  const { sheetId } = useSheetStore();
  const { books, isLoading, error, mutate } = useBooks();
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageSize = useFitPageSize(containerRef, ROW_HEIGHT);

  const pageCount = Math.max(1, Math.ceil(books.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageBooks = books.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  async function handleDelete(id: string) {
    if (!sheetId) return;
    const res = await fetch(`/api/books/${id}?sheetId=${encodeURIComponent(sheetId)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      mutate((current) => ({
        books: (current?.books ?? []).filter((b) => b.id !== id),
      }), { revalidate: false });
    }
  }

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
      <div className="flex items-center justify-center gap-4 border-t px-4 py-2">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          aria-label="上一頁"
          className="text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-400"
        >
          ‹
        </button>
        <span className="whitespace-nowrap text-xs text-gray-500">
          第 {currentPage + 1} / {pageCount} 頁
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={currentPage === pageCount - 1}
          aria-label="下一頁"
          className="text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-400"
        >
          ›
        </button>
      </div>
    ) : null;

  return (
    <div ref={containerRef}>
      {/* 手機版：卡片列表，欄位太多的表格在小螢幕上不好讀 */}
      <div className="rounded-lg border bg-white md:hidden">
        <ul className="divide-y">
          {pageBooks.map((b, i) => (
            <li key={b.id || `card-${i}`}>
              <Link href={`/books/${b.id}/edit`} className="flex gap-3 p-3 hover:bg-gray-50">
                <Cover url={b.coverUrl} title={b.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    <span className="mr-2 text-xs tabular-nums text-gray-400">
                      #{books.length - (currentPage * pageSize + i)}
                    </span>
                    {b.title}
                  </p>
                  <p className="truncate text-xs text-gray-500">{b.author}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                    <StatusBadge status={b.status} />
                    <span>{[b.platform, b.domain, b.type].filter(Boolean).join(" · ")}</span>
                  </p>
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

      <div className="hidden w-full overflow-x-auto rounded-lg border bg-white md:block">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="w-14 whitespace-nowrap px-4 py-2">封面</th>
            <th className="w-80 min-w-70 whitespace-nowrap px-4 py-2">書名</th>
            <th className="w-35 whitespace-nowrap px-4 py-2">作者</th>
            <th className="w-22.5 whitespace-nowrap px-4 py-2">狀態</th>
            <th className="w-30 whitespace-nowrap px-4 py-2">平台</th>
            <th className="w-27.5 whitespace-nowrap px-4 py-2">開始日期</th>
            <th className="w-27.5 whitespace-nowrap px-4 py-2">完成日期</th>
            <th className="w-30 whitespace-nowrap px-4 py-2">領域</th>
            <th className="w-25 whitespace-nowrap px-4 py-2">屬性</th>
            <th className="w-22.5 whitespace-nowrap px-4 py-2">語言</th>
            <th className="w-22.5 whitespace-nowrap px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {pageBooks.map((b, i) => (
            <tr key={b.id || `row-${i}`} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">
                <Link href={`/books/${b.id}/edit`} className="block">
                  <Cover url={b.coverUrl} title={b.title} />
                </Link>
              </td>
              <td className="max-w-0 overflow-hidden px-4 py-2 font-medium">
                <Link
                  href={`/books/${b.id}/edit`}
                  className="flex max-w-full items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap hover:underline"
                >
                  <span className="shrink-0 text-xs tabular-nums text-gray-400">
                    #{books.length - (currentPage * pageSize + i)}
                  </span>
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    {b.title}
                  </span>
                </Link>
              </td>
              <td className="max-w-0 overflow-hidden whitespace-nowrap px-4 py-2">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.author}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-2">
                <StatusBadge status={b.status} />
              </td>
              <td className="max-w-0 overflow-hidden whitespace-nowrap px-4 py-2">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.platform}</span>
              </td>
              <td className="max-w-0 overflow-hidden whitespace-nowrap px-4 py-2">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.startDate ?? "—"}</span>
              </td>
              <td className="max-w-0 overflow-hidden whitespace-nowrap px-4 py-2">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.endDate ?? "—"}</span>
              </td>
              <td className="max-w-0 overflow-hidden whitespace-nowrap px-4 py-2">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.domain}</span>
              </td>
              <td className="max-w-0 overflow-hidden whitespace-nowrap px-4 py-2">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.type}</span>
              </td>
              <td className="max-w-0 overflow-hidden whitespace-nowrap px-4 py-2">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{b.language}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-2 space-x-2">
                <Link href={`/books/${b.id}/edit`} className="text-xs text-gray-600 hover:underline">
                  編輯
                </Link>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  刪除
                </button>
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
