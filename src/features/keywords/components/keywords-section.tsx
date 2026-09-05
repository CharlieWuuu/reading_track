"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { PageMessage } from "@/components/layout/page-message";
import { Spinner } from "@/components/ui/spinner";
import { useKeywordInfos } from "@/features/keywords/api/use-keyword-infos";
import { KeywordCards } from "@/features/keywords/components/keyword-cards";
import { KeywordPopup } from "@/features/keywords/components/keyword-popup";
import { KeywordTimeline } from "@/features/keywords/components/keyword-timeline";
import { KeywordTreemap } from "@/features/keywords/components/keyword-treemap";
import { getKeywordEntries } from "@/features/keywords/utils/keyword-stats";
import { Book } from "@/types/book";

/** leaflet 直接碰 window，不能在伺服器端預先產生 */
const KeywordMap = dynamic(
  () => import("@/features/keywords/components/keyword-map").then((m) => m.KeywordMap),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loading}>
        <Spinner size={20} className="text-gray-400" />
      </div>
    ),
  },
);

const styles = {
  wrap: "flex min-h-0 flex-1 flex-col gap-3",
  panel: "flex min-h-0 flex-1 flex-col gap-3 rounded-surface border bg-white p-4 md:p-5",
  // 地圖自己就是一整面內容，留白只會讓它變小；底圖直接貼到框線
  mapPanel: "flex min-h-0 flex-1 flex-col overflow-hidden rounded-surface border bg-white",
  chart: "min-h-0 flex-1",
  cards: "min-h-0 flex-1 overflow-y-auto",
  loading: "flex h-full items-center justify-center text-xs text-gray-400",
};

export type KeywordView = "card" | "chart" | "map" | "timeline";

/**
 * 關鍵字的四種看法。分析型的三種（圖表、地圖、年代）掛在統計底下，
 * 卡片留在閱讀——那一頁是拿來翻的，不是拿來看分布的。
 *
 * 兩邊共用同一個元件，差別只在 view 由誰決定：閱讀那邊固定卡片，
 * 統計那邊由頁首的「顯示方式」給。
 */
export function KeywordsSection({ books, view }: { books: Book[]; view: KeywordView }) {
  const { byName } = useKeywordInfos();
  const [viewing, setViewing] = useState<string | null>(null);

  const entries = getKeywordEntries(books);
  if (entries.length === 0) {
    return <PageMessage fill>還沒有任何關鍵字，先到書籍的「關鍵字」欄記幾個</PageMessage>;
  }

  return (
    <div className={styles.wrap}>
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
