"use client";

import { ReadingStatus } from "@/types/book";

/**
 * 閱讀狀態是有順序的進度，不是平行的分類，所以畫成一顆點的深淺，
 * 而不是三種顏色的徽章。在讀是唯一有彩度的一顆——那是清單上最該被看見的。
 */
export const STATUS_DOTS: Record<ReadingStatus, string> = {
  想讀: "bg-status-want-dot",
  閱讀中: "bg-status-reading-dot",
  // 已讀完是多數狀態，給最淡的一階＝「這件事結束了」
  已讀完: "bg-status-done-dot",
};

/** 點旁邊要不要寫字：清單裡一列只有一顆點，詳情頁才把狀態說出來 */
export function StatusBadge({ status, label = true }: { status: ReadingStatus; label?: boolean }) {
  return (
    <span className="text-byline text-ink-muted inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
      <span
        aria-hidden
        className={`size-[7px] shrink-0 rounded-full ${STATUS_DOTS[status] ?? STATUS_DOTS.想讀}`}
      />
      {label ? status : <span className="sr-only">{status}</span>}
    </span>
  );
}
