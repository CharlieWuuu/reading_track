"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ChartPie, GanttChartSquare, LayoutGrid, Map } from "lucide-react";
import { PageMessage } from "@/components/layout/page-message";
import { ViewToggle } from "@/components/ui/controls";
import { useKeywordInfos } from "@/features/keywords/api/use-keyword-infos";
import { KeywordCards } from "@/features/keywords/components/keyword-cards";
import { KeywordPopup } from "@/features/keywords/components/keyword-popup";
import { KeywordTimeline } from "@/features/keywords/components/keyword-timeline";
import { KeywordTreemap } from "@/features/keywords/components/keyword-treemap";
import { getKeywordEntries } from "@/features/keywords/utils/keyword-stats";
import { useUrlParams } from "@/hooks/useUrlParam";
import { Book } from "@/types/book";

/** leaflet 直接碰 window，不能在伺服器端預先產生 */
const KeywordMap = dynamic(
  () => import("@/features/keywords/components/keyword-map").then((m) => m.KeywordMap),
  { ssr: false, loading: () => <div className={styles.loading}>地圖載入中…</div> },
);

const styles = {
  wrap: "flex min-h-0 flex-1 flex-col gap-3",
  tabs: "flex shrink-0 justify-end",
  panel: "flex min-h-0 flex-1 flex-col gap-3 rounded-lg border bg-white p-4 md:p-5",
  // 地圖自己就是一整面內容，留白只會讓它變小；底圖直接貼到框線
  mapPanel: "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-white",
  chart: "min-h-0 flex-1",
  cards: "min-h-0 flex-1 overflow-y-auto",
  loading: "flex h-full items-center justify-center text-xs text-gray-400",
};

const ICON = { size: 16, strokeWidth: 1.5 } as const;

export const KEYWORD_VIEWS = [
  { key: "card", label: "卡片", Icon: () => <LayoutGrid {...ICON} /> },
  { key: "chart", label: "圖表", Icon: () => <ChartPie {...ICON} /> },
  { key: "map", label: "地圖", Icon: () => <Map {...ICON} /> },
  { key: "timeline", label: "年代", Icon: () => <GanttChartSquare {...ICON} /> },
] as const;

export type KeywordView = (typeof KEYWORD_VIEWS)[number]["key"];

/**
 * 關鍵字的四種看法。獨立成元件是因為它同時是「關鍵字」整頁與「筆記」的一個分頁，
 * 兩邊要一模一樣——手機少了地圖與年代，就只是因為當初沒共用。
 *
 * 用 view 而不是 tab 記在網址上：外層的分頁已經佔走 tab 了。
 */
export function useKeywordView() {
  const { searchParams, setParams } = useUrlParams();
  // 預設看卡片：內容本身比分布好看，圖表與地圖是點進去才要的
  const param = searchParams.get("view");
  const view: KeywordView = KEYWORD_VIEWS.some((v) => v.key === param)
    ? (param as KeywordView)
    : "card";
  const setView = (next: KeywordView) => setParams({ view: next === "card" ? null : next });
  return { view, setView };
}

export function KeywordsSection({
  books,
  /** 筆記頁把切換做在「關鍵字」那個分頁上，這裡就不再自己畫一排 */
  showSwitch = true,
}: {
  books: Book[];
  showSwitch?: boolean;
}) {
  const { view, setView } = useKeywordView();
  const { byName } = useKeywordInfos();
  const [viewing, setViewing] = useState<string | null>(null);

  const entries = getKeywordEntries(books);
  if (entries.length === 0) {
    return <PageMessage>還沒有任何關鍵字，先到書籍的「關鍵字」欄記幾個</PageMessage>;
  }

  return (
    <div className={styles.wrap}>
      {/* 這是檢視切換不是分頁，所以用 icon，並待在內容區右上角 */}
      {showSwitch && (
        <div className={styles.tabs}>
          <ViewToggle items={KEYWORD_VIEWS} value={view} onChange={setView} />
        </div>
      )}

      {view === "chart" ? (
        <div className={styles.panel}>
          <div className={styles.chart}>
            <KeywordTreemap entries={entries} infos={byName} onSelect={setViewing} />
          </div>
        </div>
      ) : view === "timeline" ? (
        <div className={styles.panel}>
          <div className={styles.chart}>
            <KeywordTimeline entries={entries} infos={byName} />
          </div>
        </div>
      ) : view === "map" ? (
        <div className={styles.mapPanel}>
          <KeywordMap books={books} infos={byName} />
        </div>
      ) : (
        <div className={styles.cards}>
          <KeywordCards books={books} />
        </div>
      )}

      {viewing && <KeywordPopup name={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
