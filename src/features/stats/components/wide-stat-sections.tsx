"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";
import { Panel } from "@/features/stats/components/panel";
import { RowEra } from "@/features/stats/components/row-era";
import { Section } from "@/features/stats/components/section-list";
import type { StatData, StatRow } from "@/utils/stats/generic-stats";

/** leaflet 直接碰 window，不能在伺服器端預先產生 */
const RowMap = dynamic(() => import("@/features/stats/components/row-map").then((m) => m.RowMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Spinner size={20} className="text-gray-400" />
    </div>
  ),
});

/**
 * 佔一整排的那幾張圖。
 *
 * 它們原本是平行的「看法」，要換頁才看得到；現在跟其他圖一樣是統計頁裡的一塊，
 * 由勾了哪些模組決定出不出現。差別只在版面——這幾張都是一整面的座標系，
 * 擠進半排會看不清楚，所以一律 fullWidth。
 *
 * 月曆與數線由呼叫端傳進來：那兩支住在 features/calendar，
 * eslint 擋 features/stats 反過來 import 它。與其加一條跨 feature 例外，
 * 不如讓兩邊的交會點留在 app 那一層（見 AGENTS.md：新增例外前先想能不能不加）。
 */
export type WideSlots = {
  calendar?: React.ReactNode;
  timeline?: React.ReactNode;
};

const LABELS: Record<string, string> = {
  calendar: "月曆",
  timeline: "數線",
  map: "地圖",
  era: "年代",
};

export function wideSections({
  data,
  rows,
  slots,
  onSelect,
}: {
  data: StatData[];
  rows: StatRow[];
  slots: WideSlots;
  /** 點一個點或一條線要去哪。沒給就不做成可點的 */
  onSelect?: (name: string) => void;
}): Section[] {
  const nodeOf = (kind: string): React.ReactNode => {
    if (kind === "calendar") return slots.calendar;
    if (kind === "timeline") return slots.timeline;
    if (kind === "map") return <RowMap rows={rows} onSelect={onSelect} />;
    if (kind === "era") return <RowEra rows={rows} onSelect={onSelect} />;
    return null;
  };

  return data.flatMap((item) => {
    const label = LABELS[item.kind];
    const node = label ? nodeOf(item.kind) : null;
    // 沒有對應元件的就不出現：月曆與數線在呼叫端沒給 slot 時（例如片段沒有期間）
    if (!label || !node) return [];
    return [
      {
        key: `${item.spec.moduleKey}-${item.kind}`,
        label,
        fullWidth: true,
        node: <Panel title={label}>{node}</Panel>,
      },
    ];
  });
}
