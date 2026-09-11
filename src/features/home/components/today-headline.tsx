import { RecordRow } from "@/lib/db/queries/catalog";

/**
 * 頭條與「這個月」。頭條是正在讀的那一筆，一頁只有一個主角，
 * 右邊那欄是本月三個數字與連續天數。
 */

const styles = {
  band: "border-rule-strong flex flex-col gap-5 border-t border-b-2 py-4 md:flex-row md:gap-7",
  cover: "bg-rule-soft h-[120px] w-[85px] shrink-0 object-cover md:h-[158px] md:w-[112px]",
  tag: "text-label text-accent tracking-label font-medium",
  title: "font-serif text-lede tracking-tight leading-tight font-semibold",
  byline: "text-byline text-ink-muted",
  meta: "text-meta text-ink-faint tabular-nums",
  side: "border-rule shrink-0 border-t pt-4 md:w-[250px] md:border-t-0 md:border-l md:pt-0 md:pl-6",
  sideHead: "border-rule-strong flex items-baseline justify-between border-b pb-1.5",
  sideLabel: "text-label tracking-label font-medium",
  number: "font-serif text-lede tracking-tight leading-none font-semibold",
};

export type MonthCount = { label: string; unit: string; value: number };

function Count({ count }: { count: MonthCount }) {
  return (
    <div className="flex-1">
      <div className="flex items-baseline gap-1">
        <span className={styles.number}>{count.value.toLocaleString()}</span>
        <span className={styles.sideLabel}>{count.unit}</span>
      </div>
      <div className={`${styles.meta} mt-1`}>{count.label}</div>
    </div>
  );
}

export function TodayHeadline({
  headline,
  month,
  counts,
  streak,
}: {
  headline?: RecordRow;
  month: string;
  counts: MonthCount[];
  streak: number;
}) {
  return (
    <div className={styles.band}>
      {/* 手機：封面與書名並排成一組，「這個月」整塊移到底下 */}
      <div className="flex min-w-0 flex-1 gap-4 md:contents">
        {headline?.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={headline.coverUrl} alt="" className={styles.cover} />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {headline ? (
            <>
              <span className={styles.tag}>
                {headline.statusKey === "reading" ? "在讀" : "最近讀完"}
              </span>
              <h2 className={styles.title}>{headline.title}</h2>
              <span className={styles.byline}>
                {[headline.creator, headline.amount && `${headline.amount} ${headline.amountUnit}`]
                  .filter(Boolean)
                  .join("・")}
              </span>
              <span className={styles.meta}>
                {headline.startDate ? `${headline.startDate} 起讀` : ""}
              </span>
            </>
          ) : (
            <p className={styles.byline}>還沒有紀錄</p>
          )}
        </div>
      </div>

      <div className={styles.side}>
        <div className={styles.sideHead}>
          <span className={styles.sideLabel}>這個月</span>
          <span className={styles.meta}>{month}</span>
        </div>
        <div className="flex gap-5 pt-3">
          {counts.map((count) => (
            <Count key={count.label} count={count} />
          ))}
        </div>
        <p className={`${styles.meta} pt-3`}>連續 {streak} 天有紀錄</p>
      </div>
    </div>
  );
}
