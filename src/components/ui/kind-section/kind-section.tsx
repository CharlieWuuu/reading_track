import Link from "next/link";
import { KindCards } from "@/components/ui/kind-cards/kind-cards";
import { KindGroup } from "@/config/kind-groups";
import { kindHref } from "@/config/kind-routes";
import { unitOfKind } from "@/config/nav";
import { fragmentCardData } from "@/utils/card-data";
import { KindSection } from "@/utils/overview-sections";

/**
 * 一個類型一區：標題、總數、幾筆、更多。group 概覽與書籍詳情都用它。
 *
 * 每個類型保留自己的畫法，卡片樣式由類型自己帶（kinds.card_style）交給 KindCards——
 * 統一成同一種列表會把佳句擠回「一行三四個字」那個問題。
 *
 * 露幾筆由呼叫端決定；這裡只管畫，不管取。
 */

const styles = {
  head: "border-rule-strong mb-3 flex items-baseline justify-between border-b pb-1.5",
  title: "font-serif text-item font-semibold",
  total: "text-meta text-ink-faint tabular-nums",
  more: "text-meta text-ink-faint hover:text-ink mt-2 inline-block",
};

export function KindSectionBlock({
  group,
  section,
  stacked,
}: {
  group: KindGroup;
  section: KindSection;
  stacked?: boolean; // 窄欄裡一列一筆
}) {
  const href = kindHref(group, section.slug);

  return (
    <section className="min-w-0">
      <div className={styles.head}>
        <h2 className={styles.title}>{section.name}</h2>
        <span className={styles.total}>
          {section.total.toLocaleString()} {unitOfKind({ countUnit: section.countUnit })}
        </span>
      </div>

      <KindCards
        style={section.cardStyle}
        items={section.rows.map(fragmentCardData)}
        stacked={stacked}
      />

      {/* 露出來的比總數少才有「更多」可看 */}
      {section.total > section.rows.length && (
        <Link href={href} className={styles.more}>
          更多 →
        </Link>
      )}
    </section>
  );
}
