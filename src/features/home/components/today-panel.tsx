/**
 * 首頁頭條右邊那格：今天記了幾筆。
 *
 * 頭條本身走共用的 OverviewHeadline，這裡只管統計——兩件事分開，
 * 首頁與概覽頁的頭條才不會各長各的。
 *
 * 這一頁叫「今天」，數字就是今天的。原本算的是這個月，跟標題對不起來。
 */

const styles = {
  // 分隔線不在這裡：它是獨立元素，由擺這塊面板的人畫，間距一律靠父層的 gap
  frame: "shrink-0 md:w-[226px]",
  head: "border-rule-strong flex items-baseline justify-between border-b pb-1.5",
  label: "text-label font-medium",
  meta: "text-meta text-ink-faint tabular-nums",
  number: "font-serif text-lede leading-none font-semibold",
};

export type DayCount = { label: string; unit: string; value: number };

function Count({ count }: { count: DayCount }) {
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

export function TodayPanel({ date, counts }: { date: string; counts: DayCount[] }) {
  return (
    <div className={styles.frame}>
      <div className={styles.head}>
        <span className={styles.label}>今天</span>
        <span className={styles.meta}>{date}</span>
      </div>
      <div className="flex gap-5 pt-3">
        {counts.map((count) => (
          <Count key={count.label} count={count} />
        ))}
      </div>
    </div>
  );
}
