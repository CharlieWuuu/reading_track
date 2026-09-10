"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { BookCover } from "@/components/ui/book-cover";
import { CoverItem } from "@/components/ui/cover-item/cover-item";
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
  frame: "flex min-h-0 min-w-0 flex-1 gap-8",
  // 自己的捲動條：中間月份格線很長，右邊窄欄通常很短，兩邊各捲各的，
  // 不要因為其中一邊比較長就把另一邊也拖走
  main: "flex min-w-0 flex-1 flex-col overflow-y-auto",
  rail: "border-rule-strong hidden w-64 shrink-0 overflow-y-auto border-l pl-6 lg:block",
  label: "text-label text-accent tracking-label font-medium",
  meta: "text-meta text-ink-faint tabular-nums",
  headline: "border-rule-strong flex gap-8 border-b pb-5",
  headlineTitle: "font-serif text-lede leading-snug font-semibold tracking-tight",
  byline: "text-byline text-ink-muted",
  summary: "text-byline text-ink leading-relaxed",
  // 欄數跟著寬度長，每欄寬度才不會沒有上限一直被拉開
  monthGrid: "grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
  month: "border-rule-strong border-b pt-4 pb-1.5",
  monthLabel: "font-serif text-item-sm font-semibold tracking-wide",
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
        {item.startDate && <span className={styles.meta}>{item.startDate} 起</span>}
      </div>
    </div>
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
};

export function OverviewLayout({
  headline,
  headlineLabel,
  headlineSummary,
  done,
  tintSeed,
  rail,
}: OverviewLayoutProps) {
  return (
    <div className={styles.frame}>
      <div className={styles.main}>
        {headline && <Headline item={headline} label={headlineLabel} summary={headlineSummary} />}

        <div>
          {byMonth(done).map((group) => (
            <div key={group.label}>
              <div className={`${styles.month} flex items-baseline justify-between`}>
                <span className={styles.monthLabel}>{group.label}</span>
                <span className={styles.meta}>{group.items.length}</span>
              </div>
              <div className={styles.monthGrid}>
                {group.items.map((item) => (
                  <CoverItem
                    key={item.id}
                    id={item.id}
                    href={item.href}
                    title={item.title}
                    coverUrl={item.coverUrl}
                    meta={item.endDate}
                    label={item.kindLabel}
                    caption={item.byline}
                    tintSeed={tintSeed?.(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {rail && <div className={styles.rail}>{rail}</div>}
    </div>
  );
}
