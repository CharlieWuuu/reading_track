import { KindCards } from "@/components/ui/kind-cards/kind-cards";
import { unitOfKind } from "@/config/nav";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { Kind } from "@/lib/db/queries/kinds";
import { fragmentCardData, recordCardData } from "@/utils/card-data";
import { byYear } from "@/utils/kind-list";

/**
 * 卡片牆：封面牆，一次看很多本。勾了封面圖的類型才有這個檢視（見 kind-views），
 * 所以一律畫封面卡，不照 card_style——那是概覽用的。照完成年分段，跟書籍原本的書封牆一樣。
 */

const styles = {
  wall: "flex flex-col gap-6 pb-10", // PageBody 自己捲，底部留白在內容尾端
  section: "flex flex-col gap-3",
  head: "border-rule-strong flex items-baseline justify-between border-b pb-1.5",
  label: "text-item-sm font-serif font-semibold",
  count: "text-meta text-ink-faint tabular-nums",
};

export function KindCardWall({
  kind,
  records,
  fragments,
}: {
  kind: Kind;
  records: RecordRow[];
  fragments: FragmentRow[];
}) {
  const unit = unitOfKind(kind);
  const cards =
    kind.group === "records"
      ? records.map((row) => ({ ...recordCardData(row), endDate: row.endDate }))
      : // 片段只有一個日期；沒填的用記下的那天，不然全部擠進「未完成」
        fragments.map((row) => ({ ...fragmentCardData(row), endDate: row.date ?? row.createdAt }));

  return (
    <div className={styles.wall}>
      {byYear(cards, "未完成").map((group) => (
        <section key={group.label} className={styles.section}>
          <div className={styles.head}>
            <span className={styles.label}>{group.label}</span>
            <span className={styles.count}>
              {group.items.length} {unit}
            </span>
          </div>
          <KindCards style="cover" items={group.items} />
        </section>
      ))}
    </div>
  );
}
