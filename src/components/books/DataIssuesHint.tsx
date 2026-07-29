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

  const shown = expanded ? issues : issues.slice(0, PREVIEW_COUNT);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex items-start justify-between gap-4">
        <p className="font-medium">
          有 {issues.length} 筆資料看起來怪怪的（不影響使用，有空再修就好）
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-xs text-amber-700 hover:underline"
        >
          知道了
        </button>
      </div>

      <ul className="mt-2 space-y-1 text-xs">
        {shown.map((issue, i) => (
          <li key={`${issue.bookId}-${issue.field}-${i}`}>
            <Link href={`/books/${issue.bookId}/edit`} className="font-medium hover:underline">
              {issue.title}
            </Link>
            <span className="text-amber-800">：{issue.message}</span>
          </li>
        ))}
      </ul>

      {issues.length > PREVIEW_COUNT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs text-amber-700 hover:underline"
        >
          {expanded ? "收合" : `還有 ${issues.length - PREVIEW_COUNT} 筆…`}
        </button>
      )}
    </div>
  );
}
