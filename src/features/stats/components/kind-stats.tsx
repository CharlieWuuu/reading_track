"use client";

import { useMemo } from "react";
import { DataGate } from "@/components/layout/data-gate";
import { SectionList } from "@/features/stats/components/section-list";
import { useModuleSections } from "@/features/stats/hooks/use-module-sections";
import { useKindRecords } from "@/hooks/use-kind-records";
import type { Kind } from "@/lib/db/queries/kinds";

/**
 * 任何類型的統計圖表。勾了哪些模組決定畫哪幾張，這裡只負責把資料攤成
 * 統計吃的形狀——紀錄與片段兩張表欄位不同，各自轉一次。
 */
export function KindStats({ kind }: { kind: Kind }) {
  const { records, fragments, isLoading, error } = useKindRecords(kind.id);
  const isRecords = kind.group === "records";

  const rows = useMemo(
    () =>
      isRecords
        ? records.map((row) => ({
            endDate: row.endDate,
            startDate: row.startDate,
            workId: row.workId,
            title: row.title,
            creator: row.creator,
            amount: row.amount?.toString() ?? "",
            platform: row.platform,
            language: row.language,
            domain: row.domain,
            subDomain: row.subDomain,
            attribute: row.attribute,
          }))
        : fragments.map((row) => ({
            // 片段沒有完成日，建檔日就是它被記下來的那天
            endDate: row.date ?? row.createdAt.slice(0, 10),
            title: row.title,
            tags: row.tags ?? "",
          })),
    [isRecords, records, fragments],
  );

  const labels = useMemo(
    () => Object.fromEntries(kind.modules.map((module) => [module.key, module.label])),
    [kind.modules],
  );
  const moduleKeys = useMemo(() => kind.modules.map((module) => module.key), [kind.modules]);

  const sections = useModuleSections({
    moduleKeys,
    labels,
    rows,
    unit: kind.countUnit || "筆",
    // 重讀只有紀錄才問得出來：片段沒有「同一個作品的第幾次」
    showRepeats: isRecords,
  });

  return (
    <DataGate
      isLoading={isLoading}
      error={error}
      isEmpty={rows.length === 0}
      emptyText={`還沒有任何${kind.name}`}
    >
      <SectionList sections={sections} />
    </DataGate>
  );
}
