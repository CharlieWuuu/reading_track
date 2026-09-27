import Link from "next/link";
import { CardData } from "@/utils/card-data";

/**
 * 像表格的一列：標題、平台、作者、摘要節錄、日期。
 *
 * 一筆一列、欄寬固定，上下幾列的欄位才對得齊——掃一整排文章時看得出
 * 「這陣子都在哪讀、讀誰的」。內容欄窄的時候欄位對不齊也放不下，改成上下疊，
 * 平台與作者併成一行。
 */

const styles = {
  row: "border-rule grid gap-x-4 gap-y-1 border-b py-3 @2xl:grid-cols-[minmax(0,2fr)_6rem_8rem_minmax(0,3fr)_6rem] @2xl:items-baseline",
  title: "font-serif text-item-sm leading-snug font-semibold line-clamp-2 hover:underline",
  cell: "text-meta text-ink-muted hidden truncate @2xl:block",
  byline: "text-meta text-ink-muted truncate @2xl:hidden", // 窄的時候平台・作者一行
  excerpt: "text-byline text-ink-faint line-clamp-2",
  date: "text-meta text-ink-faint tabular-nums @2xl:text-right",
};

export function RowCard({ data }: { data: CardData }) {
  const byline = [data.platform, data.creator].filter(Boolean).join("・");
  return (
    <div className={styles.row}>
      <Link href={data.href} className={styles.title}>
        {data.title}
      </Link>
      <span className={styles.cell}>{data.platform}</span>
      <span className={styles.cell}>{data.creator}</span>
      {byline && <span className={styles.byline}>{byline}</span>}
      <p className={styles.excerpt}>{data.body}</p>
      <span className={styles.date}>{data.date.slice(0, 10)}</span>
    </div>
  );
}
