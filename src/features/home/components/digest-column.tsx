import Link from "next/link";
import { KindCard, STACKED } from "@/components/ui/kind-cards/kind-cards";
import { StyledCard } from "@/utils/card-data";

// 首頁一個 group 一欄：這個月的每一筆加「看全部」。卡片照類型樣式，欄窄一律一筆一列

const styles = {
  head: "border-rule-strong flex items-baseline justify-between border-b pb-1.5",
  title: "font-serif text-item font-semibold",
  meta: "text-meta text-ink-faint tabular-nums",
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

      <div className={`${STACKED} pt-3`}>
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
