const styles = {
  statBlock: "border-rule border-b py-3 first:pt-0 last:border-b-0",
  labelInk: "text-label text-ink tracking-label",
  statValue: "font-serif text-item leading-tight font-semibold tabular-nums",
  statCaption: "text-meta text-ink-faint",
};

/** 統計：小標籤、「數字+單位」同一行、下面一行說明——右側欄第一塊，全站概覽頁共用 */
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
