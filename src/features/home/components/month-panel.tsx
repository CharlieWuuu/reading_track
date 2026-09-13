/**
 * 首頁頭條右邊那格：本月三個數字與連續天數。
 *
 * 頭條本身走共用的 OverviewHeadline，這裡只管統計——兩件事分開，
 * 首頁與概覽頁的頭條才不會各長各的。
 */

const styles = {
  frame:
    "border-rule shrink-0 border-t pt-4 md:w-[250px] md:border-t-0 md:border-l md:pt-0 md:pl-6",
  head: "border-rule-strong flex items-baseline justify-between border-b pb-1.5",
  label: "text-label tracking-label font-medium",
  meta: "text-meta text-ink-faint tabular-nums",
  number: "font-serif text-lede tracking-tight leading-none font-semibold",
};

export type MonthCount = { label: string; unit: string; value: number };

function Count({ count }: { count: MonthCount }) {
  return (
    <div className="flex-1">
      <div className="flex items-baseline gap-1">
        <span className={styles.number}>{count.value.toLocaleString()}</span>
        <span className={styles.label}>{count.unit}</span>
      </div>
      <div className={`${styles.meta} mt-1`}>{count.label}</div>
    </div>
  );
}

export function MonthPanel({
  month,
  counts,
  streak,
}: {
  month: string;
  counts: MonthCount[];
  streak: number;
}) {
  return (
    <div className={styles.frame}>
      <div className={styles.head}>
        <span className={styles.label}>這個月</span>
        <span className={styles.meta}>{month}</span>
      </div>
      <div className="flex gap-5 pt-3">
        {counts.map((count) => (
          <Count key={count.label} count={count} />
        ))}
      </div>
      <p className={`${styles.meta} pt-3`}>連續 {streak} 天有紀錄</p>
    </div>
  );
}
