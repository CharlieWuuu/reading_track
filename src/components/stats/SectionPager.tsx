"use client";

import { useState } from "react";
import { PagerButton } from "@/components/ui/PagerButton";
import { usePagingMode } from "@/lib/usePagingMode";

export type Section = { key: string; label: string; node: React.ReactNode };

/**
 * 統計頁一次只顯示一個區塊，剛好塞滿畫面、用翻頁換下一個，
 * 避免在手機（尤其是慢速閱讀器）上長長地捲。
 */
export function SectionPager({ sections }: { sections: Section[] }) {
  const [page, setPage] = useState(0);
  const current = Math.min(page, sections.length - 1);
  const { scrolling } = usePagingMode();

  // 區塊數量會隨螢幕寬度變（手機拆得比較細），所以每次算出的 current 都要夾在範圍內

  // 捲動模式：所有區塊一路往下排，不再一次只顯示一個。
  // 每個區塊要給明確高度——圖表是 height="100%"，父層沒有高度的話會縮成 0 而看不見。
  if (scrolling) {
    return (
      <div className="flex flex-col gap-6 pb-6">
        {sections.map((section) => (
          <div key={section.key} className="flex h-[26rem] flex-col sm:h-[32rem]">
            <h3 className="mb-2 shrink-0 text-sm font-medium text-gray-500">{section.label}</h3>
            <div className="flex min-h-0 flex-1 flex-col">{section.node}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">{sections[current]?.node}</div>

      {sections.length > 1 && (
        <div className="mt-2 flex shrink-0 items-center justify-center gap-3 p-2">
          <PagerButton
            direction="prev"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={current === 0}
            label="上一頁"
          />
          <span className="whitespace-nowrap text-xs text-gray-500">
            {sections[current]?.label}（{current + 1} / {sections.length}）
          </span>
          <PagerButton
            direction="next"
            onClick={() => setPage((p) => Math.min(sections.length - 1, p + 1))}
            disabled={current === sections.length - 1}
            label="下一頁"
          />
        </div>
      )}
    </div>
  );
}
