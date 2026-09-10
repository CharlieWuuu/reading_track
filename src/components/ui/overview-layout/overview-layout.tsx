"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef } from "react";
import { BookCover } from "@/components/ui/book-cover";
import { COVER_CARD_GRID, CoverCard } from "@/components/ui/cover-card/cover-card";
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
  frame: "flex min-h-0 min-w-0 flex-1 items-stretch gap-8",
  // 自己的捲動條：中間月份格線很長，右邊窄欄通常很短，兩邊各捲各的，
  // 不要因為其中一邊比較長就把另一邊也拖走
  main: "flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto",
  rail: "border-rule-strong hidden w-64 shrink-0 flex-col gap-8 self-stretch overflow-y-auto border-l pl-6 lg:flex",
  label: "text-label text-accent tracking-label font-medium",
  meta: "text-meta text-ink-faint tabular-nums",
  headline: "border-rule-strong flex gap-8 border-b pb-5",
  headlineTitle: "font-serif text-lede leading-snug font-semibold tracking-tight",
  byline: "text-byline text-ink-muted",
  summary: "text-byline text-ink leading-relaxed",
  monthList: "flex flex-col gap-5",
  month: "border-rule-strong border-b pb-1.5",
  monthLabel: "font-serif text-item-sm font-semibold tracking-wide",
  sentinel: "h-px",
  loadingMore: "text-meta text-ink-faint py-4 text-center",
};

/** 中點接起來的一行小字。空的不留下多餘的點 */
const joinMeta = (parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join("・");

function Headline({
  item,
  label,
  summary,
}: {
  item: OverviewItem;
  label: string;
  summary?: string;
}) {
  return (
    <div className={styles.headline}>
      {item.coverUrl && (
        <div className="w-28.75 shrink-0">
          <BookCover url={item.coverUrl} title={item.title} size="full" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className={styles.label}>{label}</span>
        <Link href={item.href} className={`${styles.headlineTitle} truncate`}>
          {item.title}
        </Link>
        <span className={styles.byline}>{joinMeta([item.byline, item.kindLabel])}</span>
        {summary && <p className={`${styles.summary} line-clamp-2`}>{summary}</p>}
        {item.startDate && (
          <span className={styles.meta}>
            {item.startDate}
            {item.startDate !== item.endDate && " 起"}
          </span>
        )}
      </div>
    </div>
  );
}

/** 月份格線裡一格的預設畫法：書籍、紀錄用這個 */
function DefaultItem({
  item,
  tintSeed,
}: {
  item: OverviewItem;
  tintSeed?: (item: OverviewItem) => string | undefined;
}) {
  return (
    <CoverCard
      id={item.id}
      href={item.href}
      title={item.title}
      coverUrl={item.coverUrl}
      meta={item.endDate}
      label={item.kindLabel}
      caption={item.byline}
      tintSeed={tintSeed?.(item)}
    />
  );
}

export type OverviewLayoutProps = {
  /** 頭條要顯示的那一件，通常是 pickHeadline 挑出來的結果 */
  headline?: OverviewItem;
  /** 頭條上方那行小字，說明為什麼是它 */
  headlineLabel: string;
  /** 頭條標題下方那段摘要（例如最新一則心得），沒有就不顯示 */
  headlineSummary?: string;
  /** 完成的，照月份排成多欄 */
  done: readonly OverviewItem[];
  /** 每格底色依這個字串決定色相；不給就用 item.id（每筆不同色） */
  tintSeed?: (item: OverviewItem) => string | undefined;
  /** 右側窄欄——各頁自己的統計、Rail 清單都放這裡；沒有就不留這塊區域 */
  rail?: ReactNode;
  /**
   * 月份格線裡一格怎麼畫。預設用 CoverCard（書籍、紀錄那種有封面的清單）；
   * 片段、書寫這種一則一張卡的頁面換成 FragmentCard，骨架（頭條、月份分段、
   * 右側統計欄）不變，只換中間這一格的畫法。
   */
  renderItem?: (item: OverviewItem) => ReactNode;
  /** 月份格線的欄數斷點。不給就用 COVER_CARD_GRID——換了 renderItem 的頁面，卡片寬度需求不同時覆寫 */
  gridClassName?: string;
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
  tintSeed,
  rail,
  renderItem,
  gridClassName = COVER_CARD_GRID,
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

    // root 指自己的捲動容器，不是 viewport——main 有獨立的 overflow-y-auto，
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
    <div className={styles.frame}>
      <div className={styles.main} ref={mainRef}>
        {headline && <Headline item={headline} label={headlineLabel} summary={headlineSummary} />}

        <div className={styles.monthList}>
          {byMonth(done).map((group) => (
            <div key={group.label || "no-date"} className="flex flex-col gap-3">
              <div className={`${styles.month} flex items-baseline justify-between`}>
                {group.label && <span className={styles.monthLabel}>{group.label}</span>}
                <span className={styles.meta}>{group.items.length}</span>
              </div>
              <div className={gridClassName}>
                {group.items.map((item) =>
                  renderItem ? (
                    <div key={item.id}>{renderItem(item)}</div>
                  ) : (
                    <DefaultItem key={item.id} item={item} tintSeed={tintSeed} />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        {onLoadMore && hasMore && <div ref={sentinelRef} className={styles.sentinel} />}
        {isLoadingMore && <div className={styles.loadingMore}>載入中…</div>}
      </div>

      {rail && <div className={styles.rail}>{rail}</div>}
    </div>
  );
}
