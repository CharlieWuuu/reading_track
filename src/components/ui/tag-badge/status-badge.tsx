"use client";

import { RecordStatus } from "@/types/book";

/**
 * 狀態是有順序的進度，不是平行的分類，所以畫成一顆點的深淺，
 * 而不是三種顏色的徽章。進行中是唯一有彩度的一顆——那是清單上最該被看見的。
 */
export const STATUS_DOTS: Record<RecordStatus, string> = {
  想要: "bg-status-want-dot",
  進行: "bg-status-reading-dot",
  // 完成是多數狀態，給最淡的一階＝「這件事結束了」
  完成: "bg-status-done-dot",
};

/** 點旁邊要不要寫字：清單裡一列只有一顆點，詳情頁才把狀態說出來 */
export function StatusBadge({ status, label = true }: { status: RecordStatus; label?: boolean }) {
  return (
    <span className="text-byline text-ink-muted inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
      <span
        aria-hidden
        className={`size-[7px] shrink-0 rounded-full ${STATUS_DOTS[status] ?? STATUS_DOTS.想要}`}
      />
      {label ? status : <span className="sr-only">{status}</span>}
    </span>
  );
}
