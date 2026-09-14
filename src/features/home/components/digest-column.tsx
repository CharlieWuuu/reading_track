import Link from "next/link";
import { imageSrc } from "@/utils/image-key";

/**
 * 「最近的紀錄／片段／書寫」共用的一欄。三筆加一條「看全部」，
 * 標題右邊是這個 group 的總數與單位——概覽是摘要，不是清單。
 */

export type DigestItem = {
  id: string;
  kind: string;
  date: string;
  title: string;
  meta: string;
  /** 封面圖，沒有就不畫——一則思緒本來就沒有封面，留空位比較難看 */
  coverUrl?: string;
};

const styles = {
  head: "border-rule-strong flex items-baseline justify-between border-b pb-1.5",
  title: "font-serif text-item font-semibold",
  meta: "text-meta text-ink-faint tabular-nums",
  row: "border-rule flex items-start gap-3 border-b py-2.5",
  cover: "rounded-surface h-14 w-10 shrink-0 object-cover",
  rowBody: "min-w-0 flex-1",
  rowHead: "flex items-baseline gap-2",
  kind: "text-label text-accent tracking-label font-medium",
  rowTitle: "font-serif text-item-sm mt-1 leading-snug font-semibold",
  more: "text-meta text-ink-faint hover:text-ink mt-2 inline-block",
};

export function DigestColumn({
  title,
  total,
  unit,
  items,
  href,
}: {
  title: string;
  total: number;
  /** 數量的單位，跟 group 綁在一起（見 config/nav.ts）——不在這裡寫死 */
  unit: string;
  items: DigestItem[];
  href: string;
}) {
  return (
    <section className="min-w-0 flex-1">
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.meta}>
          {total.toLocaleString()} {unit}
        </span>
      </div>

      {items.map((item) => (
        <div key={item.id} className={styles.row}>
          {item.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc(item.coverUrl)} alt="" loading="lazy" className={styles.cover} />
          )}
          <div className={styles.rowBody}>
            <div className={styles.rowHead}>
              <span className={styles.kind}>{item.kind}</span>
              <span className={styles.meta}>{item.date}</span>
            </div>
            <p className={styles.rowTitle}>{item.title}</p>
            <p className={styles.meta}>{item.meta}</p>
          </div>
        </div>
      ))}

      <Link href={href} className={styles.more}>
        看全部 →
      </Link>
    </section>
  );
}
