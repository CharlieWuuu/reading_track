"use client";

import { ReactNode, useEffect, useRef } from "react";
import { PageAside, PageMain } from "@/components/layout/page-body";
import { OverviewHeadline } from "@/components/ui/overview-layout/overview-headline";
import { byMonth, OverviewItem } from "@/utils/overview";

/**
 * 概覽頁的共用骨架：一頁只有一個主角。
 *
 * 最近開始的那一件放成頭條，完成的照月份分段排成多欄，右側窄欄放什麼
 * 交給呼叫端（書籍要頁數統計、其餘只要在讀／待辦清單，沒有共通量化指標
 * 能寫死在這裡）。
 *
 * 月份是刻度，橫跨整個寬度；同一個月的條目在它底下橫著填成三欄。
 * 用 CSS columns 會直著填——2019 到 2026 的資料排出來是左欄 2026、中欄 2024，讀不下去。
 * 分隔全部用線，不用卡片框——這是報紙的做法，同樣的資訊量佔的空間比卡片少一半。
 */

const styles = {
  main: "flex flex-col gap-5",
  // 窄螢幕沒有右欄，同一份內容改插在頭條下面——「現在在讀什麼」比「上個月讀完什麼」先看到
  railInline: "flex flex-col gap-5 lg:hidden",
  meta: "text-meta text-ink-faint tabular-nums",
  monthList: "flex flex-col gap-5",
  month: "border-rule-strong border-b pb-1.5",
  monthLabel: "font-serif text-item-sm font-semibold",
  sentinel: "h-px",
  loadingMore: "text-meta text-ink-faint py-4 text-center",
};

export type OverviewLayoutProps = {
  /** 頭條要顯示的那一件，通常是 pickHeadline 挑出來的結果 */
  headline?: OverviewItem;
  /** 頭條上方那行小字，說明為什麼是它 */
  headlineLabel: string;
  /** 頭條標題下方那段摘要（例如最新一則心得），沒有就不顯示 */
  headlineSummary?: string;
  /** 完成的，照月份排成多欄 */
  done: readonly OverviewItem[];
  /** 數量的單位：一「筆」紀錄、一「則」片段。月份標題右邊那個數字要接它 */
  unit?: string;
  /**
   * 右側窄欄——各頁自己的統計、Rail 清單都放這裡；沒有就不留這塊區域。
   *
   * 窄螢幕收掉右欄，同一份內容改插在頭條與月份格線之間：手機看不到右欄，
   * 「在讀」「想要」就等於消失了，但那正是最常想確認的一段。
   */
  rail?: ReactNode;
  /** 窄螢幕不把 rail 插進內容裡。書寫那頁的統計在手機上只是把內容往下推 */
  railDesktopOnly?: boolean;
  /**
   * 月份格線裡一格怎麼畫、整片怎麼排。一律由呼叫端給（styledGrid）：
   * 長相跟著那一筆的類型設定走，骨架不替誰決定——本來預設畫封面卡，紀錄就永遠是封面卡。
   */
  renderItem: (item: OverviewItem) => ReactNode;
  gridClassName: string;
  /** 一筆佔多寬。混了幾種樣式時用得到（見 styledGrid），沒給就交給格線 */
  itemClassName?: (item: OverviewItem) => string;
  /** 捲到底時呼叫。不給就是原本的整包展示，不會建立任何觀察者 */
  onLoadMore?: () => void;
  /** 還有沒有下一批——false 時不再觀察 sentinel，避免最後一頁還一直觸發 */
  hasMore?: boolean;
  /** 下一批正在載入中，sentinel 位置顯示提示 */
  isLoadingMore?: boolean;
};

export function OverviewLayout({
  headline,
  headlineLabel,
  headlineSummary,
  done,
  unit = "筆",
  rail,
  railDesktopOnly,
  renderItem,
  gridClassName,
  itemClassName,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: OverviewLayoutProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // onLoadMore 幾乎每次 render 都是新的閉包（呼叫端的 hook 裡帶著當下的分頁狀態），
  // 用 ref 存最新的那一個，observer 才不用跟著每個 render 拆掉重建——
  // 只在 hasMore 真的從有變沒有（或反過來）時才需要重新决定要不要觀察
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  const hasLoadMore = Boolean(onLoadMore);

  useEffect(() => {
    if (!hasLoadMore || !hasMore) return;
    const root = mainRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    // root 指 PageMain 這個捲動容器，不是 viewport——
    // 用預設 viewport 觀察在這種內層捲動的版面裡根本不會觸發
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMoreRef.current?.();
      },
      { root },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasLoadMore, hasMore]);

  return (
    <>
      <PageMain ref={mainRef}>
        <div className={styles.main}>
          {headline && (
            <OverviewHeadline item={headline} label={headlineLabel} summary={headlineSummary} />
          )}

          {rail && !railDesktopOnly && <div className={styles.railInline}>{rail}</div>}

          <div className={styles.monthList}>
            {byMonth(done).map((group) => (
              <div key={group.label || "no-date"} className="flex flex-col gap-3">
                <div className={`${styles.month} flex items-baseline justify-between`}>
                  {group.label && <span className={styles.monthLabel}>{group.label}</span>}
                  <span className={styles.meta}>
                    {group.items.length} {unit}
                  </span>
                </div>
                <div className={gridClassName}>
                  {group.items.map((item) => (
                    <div key={item.id} className={itemClassName?.(item)}>
                      {renderItem(item)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {onLoadMore && hasMore && <div ref={sentinelRef} className={styles.sentinel} />}
          {isLoadingMore && <div className={styles.loadingMore}>載入中…</div>}
        </div>
      </PageMain>

      {rail && <PageAside>{rail}</PageAside>}
    </>
  );
}
