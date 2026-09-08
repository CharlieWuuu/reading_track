import Link from "next/link";

/**
 * 「最近的紀錄／片段／專欄」共用的一欄。三筆加一條「看全部」，
 * 標題右邊是這一堆的總數——概覽是摘要，不是清單。
 */

export type DigestItem = {
  id: string;
  kind: string;
  date: string;
  title: string;
  meta: string;
};

const styles = {
  head: "border-rule-strong flex items-baseline justify-between border-b pb-1.5",
  title: "font-serif text-item font-semibold",
  meta: "text-meta text-ink-faint tabular-nums",
  row: "border-rule border-b py-2.5",
  rowHead: "flex items-baseline gap-2",
  kind: "text-label text-accent tracking-label font-medium",
  rowTitle: "font-serif text-item-sm mt-1 leading-snug font-semibold",
  more: "text-meta text-ink-faint hover:text-ink mt-2 inline-block",
};

export function DigestColumn({
  title,
  total,
  items,
  href,
}: {
  title: string;
  total: number;
  items: DigestItem[];
  href: string;
}) {
  return (
    <section className="min-w-0 flex-1">
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.meta}>{total.toLocaleString()}</span>
      </div>

      {items.map((item) => (
        <div key={item.id} className={styles.row}>
          <div className={styles.rowHead}>
            <span className={styles.kind}>{item.kind}</span>
            <span className={styles.meta}>{item.date}</span>
          </div>
          <p className={styles.rowTitle}>{item.title}</p>
          <p className={styles.meta}>{item.meta}</p>
        </div>
      ))}

      <Link href={href} className={styles.more}>
        看全部 →
      </Link>
    </section>
  );
}
