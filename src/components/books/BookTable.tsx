"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSheetStore } from "@/store/useSheetStore";
import { Book } from "@/types/book";

export function BookTable() {
  const { sheetId } = useSheetStore();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sheetId) return;
    setLoading(true);
    setError("");
    fetch(`/api/books?sheetId=${encodeURIComponent(sheetId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "讀取失敗");
        setBooks(data.books ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "讀取失敗"))
      .finally(() => setLoading(false));
  }, [sheetId]);

  async function handleDelete(id: string) {
    if (!sheetId) return;
    const res = await fetch(`/api/books/${id}?sheetId=${encodeURIComponent(sheetId)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setBooks((prev) => prev.filter((b) => b.id !== id));
    }
  }

  if (!sheetId) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        請先到「設定」頁面連接 Google Sheet
      </div>
    );
  }

  if (loading) {
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
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2">書名</th>
            <th className="px-4 py-2">作者</th>
            <th className="px-4 py-2">平台</th>
            <th className="px-4 py-2">開始日期</th>
            <th className="px-4 py-2">完成日期</th>
            <th className="px-4 py-2">領域</th>
            <th className="px-4 py-2">屬性</th>
            <th className="px-4 py-2">語言</th>
            <th className="px-4 py-2" />
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
              <td className="px-4 py-2">{b.author}</td>
              <td className="px-4 py-2">{b.platform}</td>
              <td className="px-4 py-2">{b.startDate ?? "—"}</td>
              <td className="px-4 py-2">{b.endDate ?? "—"}</td>
              <td className="px-4 py-2">{b.domain}</td>
              <td className="px-4 py-2">{b.type}</td>
              <td className="px-4 py-2">{b.language}</td>
              <td className="px-4 py-2 space-x-2">
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
