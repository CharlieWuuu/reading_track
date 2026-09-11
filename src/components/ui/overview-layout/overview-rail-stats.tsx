const styles = {
  statBlock: "border-rule border-b py-3 first:pt-0 last:border-b-0",
  labelInk: "text-label text-ink tracking-label",
  statValue: "font-serif text-item leading-tight font-semibold tabular-nums",
  statCaption: "text-meta text-ink-faint",
  listBlock: "border-rule border-b py-3 first:pt-0 last:border-b-0",
  listHead: "flex items-baseline justify-between pb-2",
  listLabel: "text-label text-ink tracking-label",
  listCount: "text-meta text-ink-faint tabular-nums",
  listRow: "border-rule-soft border-b py-1.5 last:border-b-0",
  listRowTitle: "font-serif text-item-sm leading-snug font-semibold",
  listRowMeta: "text-meta text-ink-faint",
};

/**
 * 統計：小標籤、「數字+單位」同一行、下面一行說明——右側欄第一塊，全站概覽頁共用。
 * 跟右欄其餘區塊（Rail、StatsRail）的間距由父層 rail 容器的 gap 統一控制，
 * 這裡不自己加 padding-bottom。
 */
export function OverviewTotalStats({
  count,
  unit,
  caption,
}: {
  count: number;
  unit: string;
  caption?: string;
}) {
  return (
    <div className={styles.statBlock}>
      <span className={styles.labelInk}>總共</span>
      <div className={styles.statValue}>
        {count} {unit}
      </div>
      {caption && <div className={styles.statCaption}>{caption}</div>}
    </div>
  );
}

export type OverviewRailListItem = {
  id: string;
  title: string;
  meta: string;
};

/**
 * 清單：標題列（小標籤＋總數）＋一串條目（標題／小字說明）——右欄「出處排行」
 * 「常一起出現的關鍵字」「沒有出處的」都用這個畫，設計稿裡同一種畫法重複三次。
 */
export function OverviewRailList({
  label,
  count,
  items,
}: {
  label: string;
  count: number;
  items: readonly OverviewRailListItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div className={styles.listBlock}>
      <div className={styles.listHead}>
        <span className={styles.listLabel}>{label}</span>
        <span className={styles.listCount}>{count}</span>
      </div>
      {items.map((item) => (
        <div key={item.id} className={styles.listRow}>
          <div className={styles.listRowTitle}>{item.title}</div>
          <div className={styles.listRowMeta}>{item.meta}</div>
        </div>
      ))}
    </div>
  );
}
