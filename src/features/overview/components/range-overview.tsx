"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { gridOf, KindCard } from "@/components/ui/kind-cards/kind-cards";
import { unitOfGroup } from "@/config/nav";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { useGroupRecords } from "@/hooks/use-group-records";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { StyledCard, styledFragment, styledRecord } from "@/utils/card-data";
import { DateRange, itemsInRange } from "@/utils/date-range";

/**
 * 年報、週報、日報共用的骨架：三個 group 各自一節。每一筆照它類型的卡片樣式畫，
 * 跟概覽、卡片牆同一支——同一種東西全站只有一種畫法，範圍報告不另外發明版面。
 *
 * 三種報告差的只是算出來的 DateRange 長度，篩選、排版邏輯完全共用。
 */

const styles = {
  // 節與節的間距由外層 gap 給，這裡只管標題與線；線與底下格線的空隙也走 gap
  section: "border-rule-strong border-b pb-1.5",
  sectionLabel: "font-serif text-item-sm font-semibold",
  meta: "text-meta text-ink-faint tabular-nums",
  empty: "text-meta text-ink-faint py-8 text-center",
};

function Section({
  label,
  cards,
  unit,
}: {
  label: string;
  cards: readonly StyledCard[];
  unit: string;
}) {
  if (cards.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className={`${styles.section} flex items-baseline justify-between`}>
        <span className={styles.sectionLabel}>{label}</span>
        <span className={styles.meta}>
          {cards.length} {unit}
        </span>
      </div>
      <div className={gridOf(cards.map((card) => card.style))}>
        {cards.map((card) => (
          <KindCard key={card.data.id} {...card} />
        ))}
      </div>
    </div>
  );
}

export function RangeOverview({
  range,
  emptyLabel = "這段期間還沒有新紀錄",
}: {
  range: DateRange;
  emptyLabel?: string;
}) {
  const records = useGroupRecords("records");
  const fragments = useGroupFragments("fragments");
  const writings = useGroupFragments("writings");

  const isLoading = records.isLoading || fragments.isLoading || writings.isLoading;
  const error = records.error || fragments.error || writings.error;

  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (isLoading) return <PageLoading />;

  const recordCards = itemsInRange<RecordRow>(records.records, range).map(styledRecord);
  const fragmentCards = itemsInRange<FragmentRow>(fragments.fragments, range).map(styledFragment);
  const writingCards = itemsInRange<FragmentRow>(writings.fragments, range).map(styledFragment);

  const total = recordCards.length + fragmentCards.length + writingCards.length;
  if (total === 0) return <div className={styles.empty}>{emptyLabel}</div>;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Section label="紀錄" cards={recordCards} unit={unitOfGroup("records")} />
      <Section label="片段" cards={fragmentCards} unit={unitOfGroup("fragments")} />
      <Section label="書寫" cards={writingCards} unit={unitOfGroup("writings")} />
    </div>
  );
}
