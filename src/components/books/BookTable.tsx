"use client";

import Link from "next/link";
import { useState } from "react";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";

const PAGE_SIZE = 20;

export function BookTable() {
  const { sheetId } = useSheetStore();
  const { books, isLoading, error, mutate } = useBooks();
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(books.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageBooks = books.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

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

  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="whitespace-nowrap px-4 py-2">書名</th>
            <th className="whitespace-nowrap px-4 py-2">作者</th>
            <th className="whitespace-nowrap px-4 py-2">平台</th>
            <th className="whitespace-nowrap px-4 py-2">開始日期</th>
            <th className="whitespace-nowrap px-4 py-2">完成日期</th>
            <th className="whitespace-nowrap px-4 py-2">領域</th>
            <th className="whitespace-nowrap px-4 py-2">屬性</th>
            <th className="whitespace-nowrap px-4 py-2">語言</th>
            <th className="whitespace-nowrap px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {pageBooks.map((b) => (
            <tr key={b.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 font-medium">
                <Link href={`/books/${b.id}/edit`} className="hover:underline">
                  {b.title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-2">{b.author}</td>
              <td className="whitespace-nowrap px-4 py-2">{b.platform}</td>
              <td className="whitespace-nowrap px-4 py-2">{b.startDate ?? "—"}</td>
              <td className="whitespace-nowrap px-4 py-2">{b.endDate ?? "—"}</td>
              <td className="whitespace-nowrap px-4 py-2">{b.domain}</td>
              <td className="whitespace-nowrap px-4 py-2">{b.type}</td>
              <td className="whitespace-nowrap px-4 py-2">{b.language}</td>
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

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-4 border-t px-4 py-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            aria-label="上一頁"
            className="text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-400"
          >
            ‹
          </button>
          <span className="text-xs text-gray-500">
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
      )}
    </div>
  );
}
