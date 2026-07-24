"use client";

import Link from "next/link";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";

export function BookTable() {
  const { sheetId } = useSheetStore();
  const { books, isLoading, error, mutate } = useBooks();

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
          {books.map((b) => (
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
    </div>
  );
}
