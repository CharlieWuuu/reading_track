"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { FRAGMENT_CARD_GRID, FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { GroupTable } from "@/components/ui/group-table/group-table";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewRailList } from "@/components/ui/overview-layout/overview-rail-stats";
import { vocabularyHref } from "@/config/routes";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { Book } from "@/types/book";
import { OverviewItem, pickHeadline, topBookSources, topKeywordsFromBooks } from "@/utils/overview";
import {
  filterVocabularyByLanguage,
  getVocabularyEntries,
  VocabularyEntry,
} from "@/utils/stats/vocabulary-stats";

function latestOf(entry: VocabularyEntry) {
  return [...entry.encounters].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))[0];
}

const RAIL_LIST_SIZE = 5;

/** 一個詞可能在同一本書相遇多次，出處排行要算「幾個詞」而非「幾次相遇」，
 * 所以每個 entry 只留一份去重過的 bookId 清單，再攤平交給共用聚合 */
function dedupedBookIds(entries: readonly VocabularyEntry[]): string[] {
  return entries.flatMap((entry) => [
    ...new Set(entry.encounters.map((enc) => enc.bookId).filter(Boolean)),
  ]);
}

/** 這個月：有出處／遇到兩次以上的個數，各當一則條目顯示 */
function thisMonthBreakdown(entries: readonly VocabularyEntry[]) {
  const withSource = entries.filter((e) => e.encounters.some((enc) => enc.bookId)).length;
  const metTwice = entries.filter((e) => e.encounters.length > 1).length;
  return [
    { id: "with-source", title: "有出處", meta: `${withSource} 個` },
    { id: "met-twice", title: "遇到兩次以上", meta: `${metTwice} 個` },
  ];
}

function VocabularyRail({ entries, books }: { entries: VocabularyEntry[]; books: Book[] }) {
  const breakdown = thisMonthBreakdown(entries);
  const bookIds = dedupedBookIds(entries);
  const sources = topBookSources(bookIds, books, "個", RAIL_LIST_SIZE);
  const keywords = topKeywordsFromBooks(bookIds, books, "個", RAIL_LIST_SIZE);

  return (
    <>
      <OverviewRailList label="這個月" count={entries.length} items={breakdown} />
      <OverviewRailList label="出處排行" count={sources.length} items={sources} />
      <OverviewRailList label="關鍵字掛最多的" count={keywords.length} items={keywords} />
    </>
  );
}

function toItem(entry: VocabularyEntry): OverviewItem {
  const latest = latestOf(entry);
  return {
    id: entry.word,
    title: entry.word,
    byline: latest.sentence,
    href: vocabularyHref(entry.word),
    startDate: latest.date,
    endDate: latest.date,
  };
}

/** 單字概覽：跟書籍頁同一套 OverviewLayout 骨架，一個詞一張卡，多次相遇合併 */
export function VocabularySection({
  books,
  view = "overview",
}: {
  books: Book[];
  view?: "overview" | "table";
}) {
  const { vocabulary, isLoading, mutate } = useRecords();
  const { searchParams } = useUrlParams();
  const entries = filterVocabularyByLanguage(
    getVocabularyEntries(vocabulary, books),
    searchParams.get("lang") ?? "",
  );

  if (isLoading) return <PageLoading />;

  const items = entries.map(toItem);

  if (view === "table") return <GroupTable items={items} onSaved={mutate} />;

  const headline = pickHeadline(items);
  const rest = items.filter((item) => item.id !== headline?.id);

  return (
    <OverviewLayout
      headline={headline}
      headlineLabel="最近記的"
      done={rest}
      rail={<VocabularyRail entries={entries} books={books} />}
      gridClassName={FRAGMENT_CARD_GRID}
      renderItem={(item) => {
        const entry = entries.find((e) => e.word === item.id)!;
        const latest = latestOf(entry);
        // 同一個詞在不同書可能各記了翻譯，重複的只留一個
        const translation = [
          ...new Set(entry.encounters.map((e) => e.wordTranslation).filter(Boolean)),
        ].join("、");
        // 讀音在各本書應該一樣，取第一個有填的就好
        const pronunciation = entry.encounters.find((e) => e.pronunciation)?.pronunciation ?? "";

        return (
          <FragmentCard
            href={vocabularyHref(entry.word)}
            title={entry.word}
            label={translation}
            detail={pronunciation}
            body={latest.sentence}
          />
        );
      }}
    />
  );
}
