import Link from "next/link";
import { FragmentRow } from "@/lib/db/queries/catalog";

/**
 * 佳句牆。一句一列，不切兩欄。
 *
 * 佳句是句子不是卡片：切成兩欄的格子，長句會被擠成一行三四個字，
 * 讀起來像被切斷。整行寬度讓它照原本的斷句排，出處靠右當署名——
 * 跟書籍頁的 QuoteBlock 同一套版式。
 */

const styles = {
  wall: "flex flex-col",
  row: "border-rule flex flex-col gap-1.5 border-b py-4 first:pt-0 last:border-b-0",
  text: "font-serif text-[15px] leading-relaxed whitespace-pre-wrap text-gray-800 md:text-base",
  meta: "text-meta text-ink-faint truncate",
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
          <blockquote className={styles.text}>{row.body || row.name}</blockquote>
          {source(row) && <p className={styles.meta}>{source(row)}</p>}
        </Link>
      ))}
    </div>
  );
}
