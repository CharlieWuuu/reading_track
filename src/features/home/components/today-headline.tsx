import { RecordRow } from "@/lib/db/queries/catalog";

/**
 * 頭條與「這個月」。頭條是正在讀的那一筆，一頁只有一個主角，
 * 右邊那欄是本月三個數字與連續天數。
 */

const styles = {
  band: "border-rule-strong flex gap-7 border-t border-b-2 py-4",
  cover: "bg-rule-soft h-[158px] w-[112px] shrink-0 object-cover",
  tag: "text-label text-accent tracking-label font-medium",
  title: "font-serif text-lede tracking-tight leading-tight font-semibold",
  byline: "text-byline text-ink-muted",
  meta: "text-meta text-ink-faint tabular-nums",
  side: "border-rule w-[250px] shrink-0 border-l pl-6",
  sideHead: "border-rule-strong flex items-baseline justify-between border-b pb-1.5",
  sideLabel: "text-label tracking-label font-medium",
  number: "font-serif text-lede tracking-tight leading-none font-semibold",
};

export type MonthCount = { label: string; unit: string; value: number };

function Count({ count }: { count: MonthCount }) {
  return (
    <div className="flex-1">
      <div className={styles.number}>{count.value.toLocaleString()}</div>
      <div className={`${styles.sideLabel} mt-1`}>{count.unit}</div>
      <div className={styles.meta}>{count.label}</div>
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
