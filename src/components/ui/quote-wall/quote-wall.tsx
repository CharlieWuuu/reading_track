import Link from "next/link";
import { BookCover } from "@/components/ui/book-cover";
import { Quote } from "@/components/ui/quote";
import { FragmentRow } from "@/lib/db/queries/catalog";

/**
 * 佳句牆。一句一列，不切兩欄——長句被擠成一行三四個字就讀不下去了。
 *
 * 左邊一張書封講出處，右邊是句子本身。一句怎麼畫交給 Quote，這裡只管
 * 排成一落、擺封面與點進去。
 */

const styles = {
  wall: "flex flex-col",
  // 封面與句子並排；min-w-0 讓長句縮得下去，不然會把封面擠掉
  row: "border-rule flex items-start gap-3 border-b py-4 last:border-b-0 first:pt-0 hover:bg-gray-50",
  body: "flex min-w-0 flex-1 flex-col gap-1.5",
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
          <BookCover url={row.coverUrl} title={row.workTitle} size="lg" />
          <div className={styles.body}>
            {/* 句子本身在 title，body 是補充（翻譯、心得）——反過來的話
                日文佳句會秀成中文翻譯，原句反而不見 */}
            <Quote
              text={row.title || row.body}
              source={source(row)}
              note={row.title ? row.body : ""}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
