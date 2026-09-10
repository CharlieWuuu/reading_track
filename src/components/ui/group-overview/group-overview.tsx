"use client";

import Link from "next/link";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewTotalStats } from "@/components/ui/overview-layout/overview-rail-stats";
import { OverviewItem, pickHeadline } from "@/utils/overview";

/**
 * 一堆東西的概覽：跟書籍概覽共用同一套骨架（OverviewLayout），
 * 差別只有右側窄欄——這裡收的是 OverviewItem 而不是 Book，紀錄那頁要把
 * 書籍、文章、電影混在同一份清單裡排，沒有共通的量化指標可以做統計區塊，
 * 右欄是統計／進行／想要，標籤全站固定，不開放呼叫端自訂。
 */

const styles = {
  railHead: "border-rule-strong flex items-baseline justify-between border-b pb-2",
  labelInk: "text-label text-ink tracking-label",
  meta: "text-meta text-ink-faint tabular-nums",
  railItem: "border-rule border-b py-[7px]",
  railTitle: "font-serif text-item-sm leading-snug font-semibold line-clamp-2",
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
  const hidden = items.length - shown.length;

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
      {hidden > 0 && (
        <span className={`${styles.meta} block pt-2`}>看全部 {items.length} 筆 →</span>
      )}
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
  /** 統計區塊大數字後面接的量詞，跟數字同一行，例如「筆」「篇」「則」 */
  unit: string;
  /** done 的真實總數——分頁時 done 只是目前已載入的那幾頁，統計數字要用這個而不是 done.length */
  doneTotal?: number;
  /** 捲到底時呼叫，不給就是原本的整包展示 */
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
};

export function GroupOverview({
  active,
  pending,
  done,
  headlineLabel,
  unit,
  doneTotal,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: GroupOverviewProps) {
  // active 沒東西、但呼叫端有給頭條標籤時（例如書寫，記下就算完成，沒有
  // 進行中這個狀態，仍想秀「最新一則」），頭條改從 done 挑最新一筆；
  // 文章沒有中間狀態也沒有頭條，headlineLabel 傳空字串代表故意不要
  const fallbackToDone = active.length === 0 && headlineLabel !== "";
  const headline = fallbackToDone ? pickHeadline(done) : pickHeadline(active);
  const rest = active.filter((item) => item.id !== headline?.id);
  const restDone = fallbackToDone ? done.filter((item) => item.id !== headline?.id) : done;

  return (
    <OverviewLayout
      headline={headline}
      headlineLabel={headlineLabel}
      done={restDone}
      tintSeed={(item) => item.kindLabel}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      rail={
        <>
          <OverviewTotalStats
            count={active.length + pending.length + (doneTotal ?? done.length)}
            unit={unit}
          />
          <Rail label="進行" items={rest} limit={5} />
          <Rail label="想要" items={pending} limit={5} />
        </>
      }
    />
  );
}
