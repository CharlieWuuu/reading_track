"use client";

import { useBookRefetchStore } from "@/features/books/stores/use-book-refetch-store";

/** 頁首上的「重新抓取資料」。表單沒登記動作就整顆不畫 */
export function BookRefetchButton() {
  const { running, note, run } = useBookRefetchStore();
  if (!run) return null;

  return (
    <div className="flex min-w-0 items-center gap-2">
      {note && <span className="truncate text-xs text-gray-500">{note}</span>}
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="rounded-control shrink-0 border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {running ? "抓取中…" : "重新抓取"}
      </button>
    </div>
  );
}
