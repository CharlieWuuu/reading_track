"use client";

import Link from "next/link";
import { useMemo } from "react";
import { bookEditHref } from "@/config/routes";
import { useBooks } from "@/hooks/use-books";
import { validateBooks } from "@/utils/validate-book";

/**
 * 從試算表搬過來的資料難免有格式對不上的地方，這裡把它們挑出來。
 *
 * 這些只是提醒，不會擋住任何操作，也不會自動改資料——所以放在設定頁，
 * 想看的時候再來看，不再跳出來擋在書單上面。
 */
export function DataIssuesPanel() {
  const { books } = useBooks();
  const issues = useMemo(() => validateBooks(books), [books]);

  return (
    <div>
      <h3 className="text-item-sm mb-2 font-serif font-semibold tracking-wide">資料檢查</h3>
      <p className="text-meta text-ink-faint mb-3">
        列出格式看起來怪怪的欄位（日期格式、頁數不是數字等）。不影響使用，點書名可以直接去修。
      </p>

      {issues.length === 0 ? (
        <p className="rounded-control border-rule text-meta text-ink-faint border border-dashed p-3">
          沒有發現問題。
        </p>
      ) : (
        <ul className="text-meta space-y-1">
          {issues.map((issue, i) => (
            <li key={`${issue.bookId}-${issue.field}-${i}`} className="truncate">
              <Link
                href={bookEditHref(issue.bookId)}
                className="text-ink font-medium hover:underline"
              >
                {issue.title}
              </Link>
              <span className="text-ink-muted">：{issue.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
