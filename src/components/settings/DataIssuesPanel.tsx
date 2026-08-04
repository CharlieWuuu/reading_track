"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBooks } from "@/lib/useBooks";
import { validateBooks } from "@/lib/validateBook";

/**
 * 使用者可能直接在 Google Sheet 裡改資料，難免會有格式對不上的地方。
 *
 * 這些只是提醒，不會擋住任何操作，也不會自動改資料——所以放在設定頁，
 * 想看的時候再來看，不再跳出來擋在書單上面。
 */
export function DataIssuesPanel() {
  const { books } = useBooks();
  const issues = useMemo(() => validateBooks(books), [books]);

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">資料檢查</h3>
      <p className="mb-3 text-xs text-gray-500">
        列出格式看起來怪怪的欄位（日期格式、頁數不是數字等）。不影響使用，點書名可以直接去修。
      </p>

      {issues.length === 0 ? (
        <p className="rounded border border-dashed p-3 text-xs text-gray-500">
          沒有發現問題。
        </p>
      ) : (
        <ul className="space-y-1 text-xs">
          {issues.map((issue, i) => (
            <li key={`${issue.bookId}-${issue.field}-${i}`} className="truncate">
              <Link href={`/books/${issue.bookId}/edit`} className="font-medium hover:underline">
                {issue.title}
              </Link>
              <span className="text-gray-600">：{issue.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
