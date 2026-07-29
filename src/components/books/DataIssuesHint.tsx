"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBooks } from "@/lib/useBooks";
import { validateBooks } from "@/lib/validateBook";

const PREVIEW_COUNT = 5;

/**
 * 使用者可能直接在 Google Sheet 裡改資料，難免會有格式對不上的地方。
 * 這裡只是溫和提醒，不會擋住任何操作，也不會自動改動資料。
 */
export function DataIssuesHint() {
  const { books } = useBooks();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const issues = useMemo(() => validateBooks(books), [books]);

  if (dismissed || issues.length === 0) return null;

  return (
    <div className="shrink-0 rounded border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
      {/* 預設只佔一行，需要細節再展開，才不會把書單擠到要捲動 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 truncate text-left"
        >
          有 {issues.length} 筆資料看起來怪怪的（不影響使用）
          <span className="ml-1 text-amber-700">{expanded ? "收合" : "查看"}</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-amber-700 hover:underline"
        >
          知道了
        </button>
      </div>

      {expanded && (
        <ul className="mt-2 space-y-1">
          {issues.slice(0, PREVIEW_COUNT).map((issue, i) => (
            <li key={`${issue.bookId}-${issue.field}-${i}`} className="truncate">
              <Link href={`/books/${issue.bookId}/edit`} className="font-medium hover:underline">
                {issue.title}
              </Link>
              <span className="text-amber-800">：{issue.message}</span>
            </li>
          ))}
          {issues.length > PREVIEW_COUNT && (
            <li className="text-amber-700">還有 {issues.length - PREVIEW_COUNT} 筆…</li>
          )}
        </ul>
      )}
    </div>
  );
}
