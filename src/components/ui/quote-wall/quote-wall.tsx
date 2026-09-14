import Link from "next/link";
import { FragmentRow } from "@/lib/db/queries/catalog";

/**
 * 佳句牆。一句一列，不切兩欄。
 *
 * 佳句是句子不是卡片：切成兩欄的格子，長句會被擠成一行三四個字，
 * 讀起來像被切斷。整行寬度讓它照原本的斷句排。
 *
 * 開頭一個引號、襯線字縮排，出處靠右加破折號當署名——照書裡的樣子排，
 * 跟 RecordItems.QuoteBlock 同一種版式。
 */

const styles = {
  wall: "flex flex-col",
  row: "flex flex-col gap-1.5 py-4 first:pt-0",
  text: "relative pl-6 font-serif text-[15px] leading-relaxed whitespace-pre-wrap text-gray-800 md:text-base",
  mark: "absolute top-0 left-0 font-serif text-3xl leading-none text-gray-300 select-none",
  meta: "text-meta text-ink-faint truncate pl-4 text-right",
};

const source = (row: FragmentRow) => [row.workTitle, row.locator].filter(Boolean).join("・");

export function QuoteWall({
  rows,
  hrefOf,
}: {
  rows: FragmentRow[];
  hrefOf: (r: FragmentRow) => string;
}) {
  return (
    <div className={styles.wall}>
      {rows.map((row) => (
        <Link key={row.id} href={hrefOf(row)} className={styles.row}>
          <blockquote className={styles.text}>
            <span aria-hidden className={styles.mark}>
              &ldquo;
            </span>
            {row.body || row.name}
          </blockquote>
          {source(row) && <p className={styles.meta}>— {source(row)}</p>}
        </Link>
      ))}
    </div>
  );
}
