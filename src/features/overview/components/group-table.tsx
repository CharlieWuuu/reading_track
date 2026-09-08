import Link from "next/link";
import { BookCover } from "@/components/ui/book-cover";
import { ListHeading } from "@/components/ui/list-heading";
import { OverviewItem } from "@/utils/overview";

/**
 * 堆概覽的表格檢視。一列一筆，欄位對齊，掃描與比較用——跟概覽的「摘要」是兩種目的。
 *
 * 混排多種類型，所以第一欄永遠是類型；書籍、電影有封面，佳句、日記沒有，
 * 沒有封面的那一欄就空著，不畫佔位框。
 *
 * 手機版收成卡片列表，橫向表格在窄螢幕上欄位會擠到看不清楚。
 */

const styles = {
  wrap: "flex flex-col gap-3",
  table: "hidden md:table w-full border-collapse text-left",
  th: "text-label text-ink-faint tracking-label border-rule-strong border-b-2 pb-2 font-medium",
  td: "border-rule border-b py-2.5 align-top",
  title: "font-serif text-item-sm font-semibold",
  byline: "text-byline text-ink-muted",
  meta: "text-meta text-ink-faint tabular-nums",
  kind: "text-label text-ink-faint tracking-label",
  cover: "h-10 w-7 shrink-0",
  mobileList: "flex flex-col md:hidden",
  mobileRow: "border-rule flex items-center gap-3 border-b py-2.5",
};

export function GroupTable({ items }: { items: readonly OverviewItem[] }) {
  return (
    <div className={styles.wrap}>
      <ListHeading label="全部" count={items.length} />

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={`${styles.th} w-10`}></th>
            <th className={`${styles.th} w-20`}>類型</th>
            <th className={styles.th}>標題</th>
            <th className={`${styles.th} w-24`}>日期</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className={styles.td}>
                {item.coverUrl !== undefined && (
                  <div className={styles.cover}>
                    <BookCover url={item.coverUrl} title={item.title} size="full" />
                  </div>
                )}
              </td>
              <td className={styles.td}>
                <span className={styles.kind}>{item.kindLabel}</span>
              </td>
              <td className={styles.td}>
                <Link href={item.href} className={styles.title}>
                  {item.title}
                </Link>
                {item.byline && <div className={styles.byline}>{item.byline}</div>}
              </td>
              <td className={styles.td}>
                <span className={styles.meta}>{item.endDate ?? item.startDate ?? ""}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.mobileList}>
        {items.map((item) => (
          <Link key={item.id} href={item.href} className={styles.mobileRow}>
            {item.coverUrl !== undefined && (
              <div className={styles.cover}>
                <BookCover url={item.coverUrl} title={item.title} size="full" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={styles.kind}>{item.kindLabel}</span>
                <span className={styles.meta}>{item.endDate ?? item.startDate ?? ""}</span>
              </div>
              <p className={`${styles.title} truncate`}>{item.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
