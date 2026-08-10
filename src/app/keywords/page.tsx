"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { KeywordCards } from "@/components/keywords/KeywordCards";
import { KeywordTimeline } from "@/components/keywords/KeywordTimeline";
import { KeywordTreemap } from "@/components/keywords/KeywordTreemap";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { getKeywordEntries } from "@/lib/keywordStats";
import { useBooks } from "@/lib/useBooks";
import { useKeywordInfos } from "@/lib/useKeywordInfos";
import { useMounted } from "@/lib/useMounted";
import { useUrlParams } from "@/lib/useUrlParam";
import { useSheetStore } from "@/store/useSheetStore";

/** leaflet 直接碰 window，不能在伺服器端預先產生 */
const KeywordMap = dynamic(
  () => import("@/components/keywords/KeywordMap").then((m) => m.KeywordMap),
  { ssr: false, loading: () => <div className={styles.loading}>地圖載入中…</div> },
);

const styles = {
  tabs: "flex items-center gap-1 rounded-lg border p-1",
  tab: "rounded px-3 py-1.5 text-sm font-medium",
  tabActive: "bg-gray-900 text-white",
  tabIdle: "text-gray-500 hover:bg-gray-100",
  body: "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto",
  // 圖表與地圖各自吃滿一頁，不再上下疊

  panel: "rounded-lg border bg-white p-4 md:p-5",
  action: "flex items-stretch gap-2",
  full: "flex min-h-0 flex-1 flex-col gap-3",
  loading: "flex h-full items-center justify-center text-xs text-gray-400",
  panelTitle: "shrink-0 text-sm font-medium",
  chart: "min-h-0 flex-1",
};

const TABS = [
  { key: "card", label: "卡片" },
  { key: "chart", label: "圖表" },
  { key: "map", label: "地圖" },
  { key: "timeline", label: "年代" },
] as const;

type Tab = (typeof TABS)[number]["key"];

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${styles.tab} ${active ? styles.tabActive : styles.tabIdle}`}
    >
      {children}
    </button>
  );
}

/** 關鍵字先獨立成一頁試用，之後再決定併進書籍還是統計 */
function Keywords() {
  const { searchParams, setParams } = useUrlParams();
  // 預設看卡片：內容本身比分布好看，圖表與地圖是點進去才要的
  const param = searchParams.get("tab");
  const tab: Tab = TABS.some((t) => t.key === param) ? (param as Tab) : "card";
  const setTab = (next: Tab) => setParams({ tab: next === "card" ? null : next });
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { books, isLoading, error } = useBooks();
  const { byName } = useKeywordInfos();

  const entries = getKeywordEntries(books);
  return (
    <>
      <PageHeader
        title="關鍵字"
        action={
          <div className={styles.action}>
            <div className={styles.tabs}>
              {TABS.map((t) => (
                <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                  {t.label}
                </TabButton>
              ))}
            </div>
          </div>
        }
      />

      <PageBody>
        {!mounted ? null : !sheetId ? (
          <PageMessage>請先到「設定」頁面連接 Google Sheet</PageMessage>
        ) : isLoading ? (
          <PageMessage>載入中…</PageMessage>
        ) : error ? (
          <PageMessage tone="error">{error}</PageMessage>
        ) : entries.length === 0 ? (
          <PageMessage>還沒有任何關鍵字，先到書籍的「關鍵字」欄記幾個</PageMessage>
        ) : tab === "chart" ? (
          <div className={styles.body}>
            <div className={`${styles.panel} ${styles.full}`}>
              <p className={styles.panelTitle}>依學科分群（格子大小＝被幾本書提到）</p>
              <div className={styles.chart}>
                <KeywordTreemap entries={entries} infos={byName} />
              </div>
            </div>
          </div>
        ) : tab === "timeline" ? (
          <div className={styles.body}>
            <div className={`${styles.panel} ${styles.full}`}>
              <p className={styles.panelTitle}>有生卒／起訖的關鍵字</p>
              <div className={styles.chart}>
                <KeywordTimeline entries={entries} infos={byName} />
              </div>
            </div>
          </div>
        ) : tab === "map" ? (
          <div className={styles.body}>
            <div className={`${styles.panel} ${styles.full}`}>
              <div className={styles.chart}>
                <KeywordMap books={books} infos={byName} />
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.body}>
            <KeywordCards books={books} />
          </div>
        )}
      </PageBody>
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function KeywordsPage() {
  return (
    <Suspense fallback={null}>
      <Keywords />
    </Suspense>
  );
}
