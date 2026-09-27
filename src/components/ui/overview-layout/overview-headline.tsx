import Link from "next/link";
import { BookCover } from "@/components/ui/book-cover";
import { OverviewItem } from "@/utils/overview";

/**
 * 最上面那一則。一頁只有一個主角——最近開始的那一本、最新的那一則。
 *
 * 三個概覽頁共用這一份，長相就是同一個。
 */

const styles = {
  band: "border-rule-strong flex flex-col gap-5 border-b pb-5 @2xl:flex-row @2xl:gap-8", // 看內容欄寬不看視窗：側欄開著時視窗寬、內容欄窄
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
}: {
  item: OverviewItem;
  label: string;
  summary?: string;
}) {
  return (
    <div className={styles.band}>
      <div className="flex min-w-0 flex-1 gap-4 @2xl:contents">
        {item.coverUrl && (
          <div className="w-21.5 shrink-0 @2xl:w-28.75">
            <BookCover url={item.coverUrl} title={item.title} size="full" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className={styles.label}>{label}</span>
          <Link href={item.href} className={`${styles.title} truncate`}>
            {item.title}
          </Link>
          <span className={styles.byline}>{joinMeta([item.byline, item.topicLabel])}</span>
          {summary && <p className={`${styles.summary} line-clamp-2`}>{summary}</p>}
          {item.startDate && (
            <span className={styles.meta}>
              {item.startDate}
              {item.startDate !== item.endDate && " 起"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
