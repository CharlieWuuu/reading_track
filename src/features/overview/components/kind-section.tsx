import Link from "next/link";
import { KindCards } from "@/components/ui/kind-cards/kind-cards";
import { kindHref } from "@/config/kind-routes";
import { unitOfKind } from "@/config/nav";
import { KindGroup } from "@/config/record-kinds";
import { KindSection } from "@/utils/overview-sections";

/**
 * 概覽頁裡的一個類型：標題、總數、幾筆、更多。
 *
 * 每個類型保留自己的畫法，畫法由類型自己帶（kinds.card_style）交給 KindCards——
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

export function KindSectionBlock({ group, section }: { group: KindGroup; section: KindSection }) {
  const href = kindHref(group, section.slug);

  return (
    <section className="min-w-0">
      <div className={styles.head}>
        <h2 className={styles.title}>{section.name}</h2>
        <span className={styles.total}>
          {section.total.toLocaleString()} {unitOfKind({ countUnit: section.countUnit })}
        </span>
      </div>

      <KindCards style={section.cardStyle} rows={section.rows} />

      {/* 露出來的比總數少才有「更多」可看 */}
      {section.total > section.rows.length && (
        <Link href={href} className={styles.more}>
          更多 →
        </Link>
      )}
    </section>
  );
}
