"use client";

import Link from "next/link";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewItem, pickHeadline } from "@/utils/overview";

/**
 * 一堆東西的概覽：跟書籍概覽共用同一套骨架（OverviewLayout），
 * 差別只有右側窄欄——這裡收的是 OverviewItem 而不是 Book，紀錄那頁要把
 * 書籍、文章、電影混在同一份清單裡排，沒有共通的量化指標可以做統計區塊，
 * 右欄只留「其餘進行中」「待辦」兩份清單。
 */

const styles = {
  railHead: "border-rule-strong flex items-baseline justify-between border-b pb-2",
  labelInk: "text-label text-ink tracking-label",
  meta: "text-meta text-ink-faint tabular-nums",
  railItem: "border-rule border-b py-[7px]",
  railTitle: "font-serif text-item-sm leading-snug font-semibold",
};

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
};

export function GroupOverview({
  active,
  pending,
  done,
  headlineLabel,
  activeLabel,
  pendingLabel,
}: GroupOverviewProps) {
  const headline = pickHeadline(active);
  const rest = active.filter((item) => item.id !== headline?.id);

  return (
    <OverviewLayout
      headline={headline}
      headlineLabel={headlineLabel}
      done={done}
      rail={
        <>
          <Rail label={activeLabel} items={rest} />
          <Rail label={pendingLabel} items={pending} limit={5} />
        </>
      }
    />
  );
}
