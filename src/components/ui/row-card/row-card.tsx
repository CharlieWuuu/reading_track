import Link from "next/link";
import { TagList } from "@/components/ui/tag-badge";
import { CardData } from "@/utils/card-data";

/**
 * 清單的一筆，兩行：
 *   標題　平台　作者　　　　日期
 *   摘要節錄
 *
 * 不對欄：標題長短差很多，對齊成表格會讓短標題後面空一大塊、長標題被切掉。
 * 標題吃剩下的寬度，放不下才截斷；標籤與日期不縮。
 */

const styles = {
  row: "border-rule flex min-w-0 flex-col gap-1 border-b py-3",
  head: "flex min-w-0 items-center gap-2",
  title: "font-serif text-item-sm min-w-0 flex-1 truncate font-semibold hover:underline",
  date: "text-meta text-ink-faint shrink-0 tabular-nums",
  excerpt: "text-byline text-ink-faint truncate",
};

export function RowCard({ data }: { data: CardData }) {
  return (
    <div className={styles.row}>
      <div className={styles.head}>
        <Link href={data.href} className={styles.title}>
          {data.title}
        </Link>
        <TagList values={[data.platform]} tone="platform" size="sm" wrap={false} />
        <TagList values={[data.creator]} tone="creator" size="sm" wrap={false} />
        <span className={styles.date}>{data.date.slice(0, 10)}</span>
      </div>
      {data.body && <p className={styles.excerpt}>{data.body}</p>}
    </div>
  );
}
