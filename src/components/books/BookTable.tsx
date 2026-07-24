"use client";

import { useBookStore } from "@/store/useBookStore";

export function BookTable() {
  const { books, removeBook } = useBookStore();

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
            <tr key={b.id} className="border-t">
              <td className="px-4 py-2 font-medium">{b.title}</td>
              <td className="px-4 py-2">{b.author}</td>
              <td className="px-4 py-2">{b.platform}</td>
              <td className="px-4 py-2">{b.startDate ?? "—"}</td>
              <td className="px-4 py-2">{b.endDate ?? "—"}</td>
              <td className="px-4 py-2">{b.domain}</td>
              <td className="px-4 py-2">{b.type}</td>
              <td className="px-4 py-2">{b.language}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => removeBook(b.id)}
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
