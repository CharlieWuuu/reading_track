import Link from "next/link";
import { Quote } from "@/components/ui/quote";
import { FragmentRow } from "@/lib/db/queries/catalog";

/**
 * 佳句牆。一句一列，不切兩欄——長句被擠成一行三四個字就讀不下去了。
 *
 * 一句怎麼畫交給 Quote，這裡只管排成一落與點進去。
 */

const styles = {
  wall: "flex flex-col",
  row: "flex flex-col gap-1.5 py-4 first:pt-0",
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
          <Quote text={row.body || row.name} source={source(row)} />
        </Link>
      ))}
    </div>
  );
}
