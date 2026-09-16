"use client";

import { useMemo } from "react";
import { DataGate } from "@/components/layout/data-gate";
import { SectionList } from "@/features/stats/components/section-list";
import { useModuleSections } from "@/features/stats/hooks/use-module-sections";
import { useWritings } from "@/hooks/use-writings";

/**
 * 書寫的統計。圖表由模組決定，不是這裡寫死——書寫三種類型（心得、思緒、
 * 週計劃）勾的模組一樣，所以合起來看就好。
 *
 * 類型分布額外給：kind 不是模組，推不出來，但一次看好幾種的時候
 * 「心得比思緒多」正是想知道的事。
 */
const WRITING_MODULES = ["title", "longText", "endDate"] as const;
// 擺在元件外面：每次 render 產一個新物件的話，useModuleSections 的 useMemo 每次都會失效
const GROUP_BY = { field: "topic", label: "類型分布" };

export function WritingStats() {
  const { writings, isLoading, error } = useWritings();

  const rows = useMemo(
    () => writings.map((writing) => ({ endDate: writing.endDate, topic: writing.topic })),
    [writings],
  );

  const sections = useModuleSections({
    moduleKeys: WRITING_MODULES,
    rows,
    unit: "筆",
    groupBy: GROUP_BY,
  });

  return (
    <DataGate
      isLoading={isLoading}
      error={error}
      isEmpty={writings.length === 0}
      emptyText="還沒有任何紀事"
    >
      <SectionList sections={sections} />
    </DataGate>
  );
}
