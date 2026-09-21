"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { CardGrid } from "@/components/ui/card-grid";
import { COVER_CARD_GRID } from "@/components/ui/cover-card/cover-card";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { OverviewCoverCard } from "@/components/ui/overview-layout/overview-layout";
import { unitOfGroup } from "@/config/nav";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { useGroupRecords } from "@/hooks/use-group-records";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { DateRange, itemsInRange } from "@/utils/date-range";
import { OverviewItem } from "@/utils/overview";
import { fragmentHref, fragmentMeta, fragmentTitle, recordItem } from "@/utils/overview-items";

/**
 * 年報、週報、日報共用的骨架：三個 group 各自按類型分節。紀錄跟紀錄概覽同一套
 * CoverCard 月份格線；片段、書寫跟片段概覽同一套 FragmentCard 卡片牆——
 * 同一種東西全站只有一種畫法，差在哪一種而已，範圍報告不另外發明版面。
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

function RecordSection({
  label,
  items,
  unit,
}: {
  label: string;
  items: readonly OverviewItem[];
  unit: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className={`${styles.section} flex items-baseline justify-between`}>
        <span className={styles.sectionLabel}>{label}</span>
        <span className={styles.meta}>
          {items.length} {unit}
        </span>
      </div>
      <div className={COVER_CARD_GRID}>
        {items.map((item) => (
          <OverviewCoverCard key={item.id} item={item} tintSeed={(row) => row.kindLabel} />
        ))}
      </div>
    </div>
  );
}

function FragmentSection({
  label,
  rows,
  unit,
}: {
  label: string;
  rows: readonly FragmentRow[];
  unit: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className={`${styles.section} flex items-baseline justify-between`}>
        <span className={styles.sectionLabel}>{label}</span>
        <span className={styles.meta}>
          {rows.length} {unit}
        </span>
      </div>
      <CardGrid>
        {rows.map((row) => (
          <FragmentCard
            key={row.id}
            href={fragmentHref(row)}
            title={fragmentTitle(row)}
            label={row.kindName}
            body={row.body}
            meta={fragmentMeta(row)}
            coverUrl={row.coverUrl}
          />
        ))}
      </CardGrid>
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

  const recordItems = itemsInRange<RecordRow>(records.records, range).map(recordItem);
  const fragmentRows = itemsInRange<FragmentRow>(fragments.fragments, range);
  const writingRows = itemsInRange<FragmentRow>(writings.fragments, range);

  const total = recordItems.length + fragmentRows.length + writingRows.length;
  if (total === 0) return <div className={styles.empty}>{emptyLabel}</div>;

  return (
    <div className="flex flex-col gap-6">
      <RecordSection label="紀錄" items={recordItems} unit={unitOfGroup("records")} />
      <FragmentSection label="片段" rows={fragmentRows} unit={unitOfGroup("fragments")} />
      <FragmentSection label="書寫" rows={writingRows} unit={unitOfGroup("writings")} />
    </div>
  );
}
