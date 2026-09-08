"use client";

import Link from "next/link";
import { BookCover } from "@/components/ui/book-cover";
import { CoverBand, CoverBandSize } from "@/components/ui/cover-band/cover-band";
import { byMonth, OverviewItem, pickHeadline } from "@/utils/overview";

/**
 * 一堆東西的概覽：一頁只有一個主角。
 *
 * 最近開始的那一件放成頭條，其餘進行中與待辦收進右邊的窄欄，完成的照月份分段。
 *
 * 月份是刻度，橫跨整個寬度；同一個月的條目在它底下橫著填成三欄。
 * 用 CSS columns 會直著填——2019 到 2026 的資料排出來是左欄 2026、中欄 2024，讀不下去。
 * 分隔全部用線，不用卡片框——這是報紙的做法，同樣的資訊量佔的空間比卡片少一半。
 *
 * 版面沿用書單概覽那一套，差別是收 OverviewItem 而不是 Book：紀錄那頁要把書籍、
 * 文章、電影混在同一份清單裡排。
 */

const styles = {
  frame: "flex min-w-0 flex-1 gap-8",
  main: "flex min-w-0 flex-1 flex-col",
  rail: "border-rule-strong hidden w-52 shrink-0 border-l pl-6 lg:block",
  railHead: "border-rule-strong flex items-baseline justify-between border-b pb-2",
  label: "text-label text-ink-faint tracking-label",
  labelInk: "text-label text-ink tracking-label",
  meta: "text-meta text-ink-faint tabular-nums",
  headline: "border-rule-strong flex gap-8 border-b-2 pb-5",
  headlineTitle: "font-serif text-lede leading-tight font-semibold tracking-tight",
  byline: "text-byline text-ink-muted",
  monthGrid: "grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3",
  month: "border-rule-strong border-b-2 pt-4 pb-1.5",
  monthLabel: "font-serif text-item-sm font-semibold tracking-wide",
  item: "border-rule border-b py-3", // 一格一條下緣線：橫著排時每一列收在同一條線上
  itemTitle: "font-serif text-item leading-snug font-semibold tracking-tight",
  railItem: "border-rule border-b py-[7px]",
  railTitle: "font-serif text-item-sm leading-snug font-semibold",
};

/** 中點接起來的一行小字。空的不留下多餘的點 */
const joinMeta = (parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join("　·　");

function Headline({ item, label }: { item: OverviewItem; label: string }) {
  return (
    <div className={styles.headline}>
      {item.coverUrl && (
        <div className="w-[118px] shrink-0">
          <BookCover url={item.coverUrl} title={item.title} size="full" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className={styles.label}>{label}</span>
        <Link href={item.href} className={styles.headlineTitle}>
          {item.title}
        </Link>
        <span className={styles.byline}>{joinMeta([item.byline, item.kindLabel])}</span>
        {item.startDate && <span className={styles.meta}>{item.startDate} 起</span>}
      </div>
    </div>
  );
}

function Rail({
  label,
  items,
  limit,
}: {
  label: string;
  items: readonly OverviewItem[];
  limit?: number;
}) {
  if (items.length === 0) return null;
  const shown = limit ? items.slice(0, limit) : items;

  return (
    <div className="pb-8">
      <div className={styles.railHead}>
        <span className={styles.labelInk}>{label}</span>
        <span className={styles.meta}>{items.length}</span>
      </div>
      {shown.map((item) => (
        <div key={item.id} className={styles.railItem}>
          <Link href={item.href} className={styles.railTitle}>
            {item.title}
          </Link>
          <div className={styles.meta}>{item.byline}</div>
        </div>
      ))}
    </div>
  );
}

export type GroupOverviewProps = {
  /** 進行中的，頭條從這裡挑 */
  active: readonly OverviewItem[];
  /** 待辦，只進窄欄 */
  pending: readonly OverviewItem[];
  /** 完成的，照月份排成多欄 */
  done: readonly OverviewItem[];
  /** 頭條上方那行小字，說明為什麼是它 */
  headlineLabel: string;
  activeLabel: string;
  pendingLabel: string;
  /** 封面帶份量跟著主角走：紀錄類（有圖）用 lg，片段與專欄（主角是文字）用 sm */
  coverSize?: CoverBandSize;
};

export function GroupOverview({
  active,
  pending,
  done,
  headlineLabel,
  activeLabel,
  pendingLabel,
  coverSize = "sm",
}: GroupOverviewProps) {
  const headline = pickHeadline(active);
  const rest = active.filter((item) => item.id !== headline?.id);

  return (
    <div className={styles.frame}>
      <div className={styles.main}>
        {headline && <Headline item={headline} label={headlineLabel} />}

        <div>
          {byMonth(done).map((group) => (
            <div key={group.label}>
              <div className={styles.month}>
                <span className={styles.monthLabel}>{group.label}</span>
              </div>
              <div className={styles.monthGrid}>
                {group.items.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <div className="flex items-baseline justify-between pb-2">
                      <span className={styles.meta}>{item.endDate}</span>
                      {item.kindLabel && <span className={styles.label}>{item.kindLabel}</span>}
                    </div>
                    <CoverBand
                      coverUrl={item.coverUrl}
                      seed={item.id}
                      label={item.bandLabel}
                      size={coverSize}
                    />
                    <Link href={item.href} className={`${styles.itemTitle} mt-3 block`}>
                      {item.title}
                    </Link>
                    <div className={`${styles.byline} pt-1.5`}>{item.byline}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.rail}>
        <Rail label={activeLabel} items={rest} />
        <Rail label={pendingLabel} items={pending} limit={5} />
      </div>
    </div>
  );
}
