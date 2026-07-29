"use client";

import { useState } from "react";

export type Section = { key: string; label: string; node: React.ReactNode };

/**
 * 統計頁一次只顯示一個區塊，剛好塞滿畫面、用翻頁換下一個，
 * 避免在手機（尤其是慢速閱讀器）上長長地捲。
 */
export function SectionPager({ sections }: { sections: Section[] }) {
  const [page, setPage] = useState(0);
  const current = Math.min(page, sections.length - 1);

  // 區塊數量會隨螢幕寬度變（手機拆得比較細），所以每次算出的 current 都要夾在範圍內

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">{sections[current]?.node}</div>

      {sections.length > 1 && (
        <div className="mt-2 flex shrink-0 items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={current === 0}
            aria-label="上一頁"
            className="text-gray-400 hover:text-gray-900 disabled:opacity-30"
          >
            ‹
          </button>
          <span className="whitespace-nowrap text-xs text-gray-500">
            {sections[current]?.label}（{current + 1} / {sections.length}）
          </span>
          <button
            onClick={() => setPage((p) => Math.min(sections.length - 1, p + 1))}
            disabled={current === sections.length - 1}
            aria-label="下一頁"
            className="text-gray-400 hover:text-gray-900 disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
