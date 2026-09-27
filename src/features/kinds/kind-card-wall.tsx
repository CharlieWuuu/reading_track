import { COVER_CARD_GRID } from "@/components/ui/cover-card/cover-card";
import { KindCards } from "@/components/ui/kind-cards/kind-cards";
import { OverviewCoverCard } from "@/components/ui/overview-layout/overview-layout";
import { unitOfKind } from "@/config/nav";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { Kind } from "@/lib/db/queries/kinds";
import { byPeriod, PeriodGroup } from "@/utils/kind-list";
import { recordItem } from "@/utils/overview-items";

/**
 * 卡片牆：一次看很多筆。照完成日分段，粒度照類型設定（card_group_by）。
 *
 * 本來只有書籍的書封牆照年分段，寫死在書籍專屬頁；現在任何類型都能選照月或照年。
 */

const styles = {
  wall: "flex flex-col gap-6 pb-10", // PageBody 自己捲，底部留白在內容尾端
  head: "border-rule-strong flex items-baseline justify-between border-b pb-1.5",
  label: "text-item-sm font-serif font-semibold",
  count: "text-meta text-ink-faint tabular-nums",
};

function Section<T>({
  group,
  unit,
  children,
}: {
  group: PeriodGroup<T>;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className={styles.head}>
        <span className={styles.label}>{group.label}</span>
        <span className={styles.count}>
          {group.items.length} {unit}
        </span>
      </div>
      {children}
    </section>
  );
}

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

  if (kind.group === "records") {
    return (
      <div className={styles.wall}>
        {byPeriod(records.map(recordItem), kind.cardGroupBy, "未完成").map((group) => (
          <Section key={group.label} group={group} unit={unit}>
            <div className={COVER_CARD_GRID}>
              {group.items.map((item) => (
                <OverviewCoverCard key={item.id} item={item} tintSeed={(i) => i.topicLabel} />
              ))}
            </div>
          </Section>
        ))}
      </div>
    );
  }

  // 片段只有一個日期；沒填的用記下的那天，不然全部擠進「未完成」
  const dated = fragments.map((row) => ({ row, endDate: row.date ?? row.createdAt.slice(0, 10) }));

  return (
    <div className={styles.wall}>
      {byPeriod(dated, kind.cardGroupBy, "未完成").map((group) => (
        <Section key={group.label} group={group} unit={unit}>
          <KindCards style={kind.cardStyle} rows={group.items.map((item) => item.row)} />
        </Section>
      ))}
    </div>
  );
}
