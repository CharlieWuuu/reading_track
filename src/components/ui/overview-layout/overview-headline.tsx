import Link from "next/link";
import { BookCover } from "@/components/ui/book-cover";
import { OverviewItem } from "@/utils/overview";

/**
 * 概覽頁最上面那一則。一頁只有一個主角——最近開始的那一本、最新的那一則。
 *
 * 封面格線（OverviewLayout）與卡片牆（片段概覽）都用這一份，兩邊的頭條長得
 * 一樣，差別只在底下怎麼排。
 */

const styles = {
  band: "border-rule-strong flex gap-8 border-b pb-5",
  label: "text-label text-accent tracking-label font-medium",
  title: "font-serif text-lede leading-snug font-semibold tracking-tight",
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
      {item.coverUrl && (
        <div className="w-28.75 shrink-0">
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
  );
}
