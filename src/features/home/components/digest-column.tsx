import Link from "next/link";
import { KindCard } from "@/components/ui/kind-cards/kind-cards";
import { StyledCard } from "@/utils/card-data";

/**
 * 「最近的紀錄／片段／書寫」共用的一欄。三筆加一條「看全部」，
 * 標題右邊是這個 group 的總數與單位——概覽是摘要，不是清單。
 *
 * 一筆照它類型的卡片樣式畫，跟概覽頁同一支 KindCard。欄很窄，一律一筆一列往下排。
 */

const styles = {
  head: "border-rule-strong flex items-baseline justify-between border-b pb-1.5",
  title: "font-serif text-item font-semibold",
  meta: "text-meta text-ink-faint tabular-nums",
  list: "flex flex-col gap-4 pt-3",
  more: "text-meta text-ink-faint hover:text-ink mt-2 inline-block",
};

export function DigestColumn({
  title,
  total,
  unit,
  cards,
  href,
}: {
  title: string;
  total: number;
  /** 數量的單位，跟 group 綁在一起（見 config/nav.ts）——不在這裡寫死 */
  unit: string;
  cards: StyledCard[];
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

      <div className={styles.list}>
        {cards.map((card) => (
          <KindCard key={card.data.id} {...card} />
        ))}
      </div>

      <Link href={href} className={styles.more}>
        看全部 →
      </Link>
    </section>
  );
}
