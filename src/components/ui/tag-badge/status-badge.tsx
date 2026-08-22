"use client";

import { ReadingStatus } from "@/types/book";

/**
 * 閱讀狀態是有順序的進度，不是平行的分類，所以用同一個色相的三個階，
 * 而不是三種顏色。實心底只有狀態在用，才不會跟同色系的分類標籤看混。
 */
export const STATUS_STYLES: Record<ReadingStatus, string> = {
  想讀: "bg-status-want-bg text-status-want-ink",
  閱讀中: "bg-status-reading-bg text-status-reading-ink",
  // 已讀完是多數狀態，給最淡的一階；同色系但幾乎不出聲＝「這件事結束了」
  已讀完: "bg-status-done-bg text-status-done-ink",
};

export function StatusBadge({ status }: { status: ReadingStatus }) {
  return (
    <span
      className={`rounded-control inline-block shrink-0 px-1.5 py-0.5 text-[11px] whitespace-nowrap ${STATUS_STYLES[status] ?? STATUS_STYLES.想讀}`}
    >
      {status}
    </span>
  );
}
