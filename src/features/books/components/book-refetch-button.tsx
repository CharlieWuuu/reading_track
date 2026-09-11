"use client";

import { ActionButton } from "@/components/ui/controls/action-button";
import { useBookRefetchStore } from "@/features/books/stores/use-book-refetch-store";

/** 頁首上的「重新抓取資料」。表單沒登記動作就整顆不畫 */
export function BookRefetchButton() {
  const { running, note, run } = useBookRefetchStore();
  if (!run) return null;

  return (
    <div className="flex min-w-0 items-center gap-2">
      {note && <span className="text-meta text-ink-faint truncate">{note}</span>}
      <ActionButton tone="secondary" onClick={run} disabled={running}>
        {running ? "抓取中…" : "重新抓取"}
      </ActionButton>
    </div>
  );
}
