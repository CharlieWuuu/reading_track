"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { CardMasonry } from "@/components/ui/card-masonry";
import { COVER_CARD_GRID, CoverCard } from "@/components/ui/cover-card/cover-card";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { useGroupRecords } from "@/hooks/use-group-records";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { DateRange, itemsInRange } from "@/utils/date-range";
import { OverviewItem } from "@/utils/overview";
import { fragmentHref, fragmentMeta, fragmentTitle, recordItem } from "@/utils/overview-items";

/**
 * 年報、週報、日報共用的骨架：三堆各自按類型分節。紀錄跟紀錄概覽同一套
 * CoverCard 月份格線；片段、書寫跟片段概覽同一套 FragmentCard 卡片牆——
 * 同一種東西全站只有一種畫法，差在哪一種而已，範圍報告不另外發明版面。
 *
 * 三種報告差的只是算出來的 DateRange 長度，篩選、排版邏輯完全共用。
 */

const styles = {
  section: "border-rule-strong border-b pt-4 pb-1.5",
  sectionLabel: "font-serif text-item-sm font-semibold tracking-wide",
  meta: "text-meta text-ink-faint tabular-nums",
  empty: "text-meta text-ink-faint py-8 text-center",
};

function RecordSection({ label, items }: { label: string; items: readonly OverviewItem[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className={`${styles.section} flex items-baseline justify-between`}>
        <span className={styles.sectionLabel}>{label}</span>
        <span className={styles.meta}>{items.length}</span>
      </div>
      <div className={COVER_CARD_GRID}>
        {items.map((item) => (
          <CoverCard
            key={item.id}
            id={item.id}
            href={item.href}
            title={item.title}
            coverUrl={item.coverUrl}
            meta={item.endDate}
            label={item.kindLabel}
            caption={item.byline}
          />
        ))}
      </div>
    </div>
  );
}

function FragmentSection({ label, rows }: { label: string; rows: readonly FragmentRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <div className={`${styles.section} flex items-baseline justify-between`}>
        <span className={styles.sectionLabel}>{label}</span>
        <span className={styles.meta}>{rows.length}</span>
      </div>
      <CardMasonry>
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
      </CardMasonry>
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
    <div>
      <RecordSection label="紀錄" items={recordItems} />
      <FragmentSection label="片段" rows={fragmentRows} />
      <FragmentSection label="書寫" rows={writingRows} />
    </div>
  );
}
