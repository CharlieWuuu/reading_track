import Link from "next/link";
import { BookCover } from "@/components/ui/book-cover";
import { OverviewItem } from "@/utils/overview";

/**
 * 最上面那一則。一頁只有一個主角——最近開始的那一本、最新的那一則。
 *
 * 首頁與三個概覽頁共用這一份，長相就是同一個。首頁右邊多一塊「這個月」，
 * 那是另一件事，用 aside 插進來，不再為它另寫一支頭條。
 */

const styles = {
  band: "border-rule-strong flex flex-col gap-5 border-b pb-5 md:flex-row md:gap-8",
  label: "text-label text-accent font-medium",
  title: "font-serif text-lede leading-snug font-semibold",
  byline: "text-byline text-ink-muted",
  summary: "text-byline text-ink leading-relaxed",
  meta: "text-meta text-ink-faint tabular-nums",
};

const joinMeta = (parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join("・");

export function OverviewHeadline({
  item,
  label,
  summary,
  aside,
}: {
  item: OverviewItem;
  label: string;
  summary?: string;
  /** 右邊那格：首頁的「這個月」。沒給就只有頭條本身 */
  aside?: React.ReactNode;
}) {
  return (
    <div className={styles.band}>
      {/* 手機封面與文字並排成一組，aside 整塊落到底下 */}
      <div className="flex min-w-0 flex-1 gap-4 md:contents">
        {item.coverUrl && (
          <div className="w-21.5 shrink-0 md:w-28.75">
            <BookCover url={item.coverUrl} title={item.title} size="full" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className={styles.label}>{label}</span>
          <Link href={item.href} className={`${styles.title} truncate`}>
            {item.title}
          </Link>
          <span className={styles.byline}>{joinMeta([item.byline, item.kindLabel])}</span>
          {summary && <p className={`${styles.summary} line-clamp-2`}>{summary}</p>}
          {item.startDate && (
            <span className={styles.meta}>
              {item.startDate}
              {item.startDate !== item.endDate && " 起"}
            </span>
          )}
        </div>
      </div>
      {aside}
    </div>
  );
}
