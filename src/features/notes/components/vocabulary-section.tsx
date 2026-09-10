"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewTotalStats } from "@/components/ui/overview-layout/overview-rail-stats";
import { vocabularyHref } from "@/config/routes";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { Book } from "@/types/book";
import { OverviewItem, pickHeadline } from "@/utils/overview";
import {
  filterVocabularyByLanguage,
  getVocabularyEntries,
  VocabularyEntry,
} from "@/utils/stats/vocabulary-stats";

/** 一個詞連例句一起占的字數比書籍一本多，欄數比其他概覽頁少一階，每欄才有空間放得下 */
const VOCABULARY_GRID = "grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-2 2xl:grid-cols-3";

function latestOf(entry: VocabularyEntry) {
  return [...entry.encounters].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))[0];
}

function toItem(entry: VocabularyEntry): OverviewItem {
  const latest = latestOf(entry);
  return {
    id: entry.word,
    title: entry.word,
    byline: latest.sentence,
    href: vocabularyHref(entry.word),
    coverUrl: latest.coverUrl,
    startDate: latest.date,
    endDate: latest.date,
    kindLabel: "單字",
  };
}

/** 單字概覽：跟書籍頁同一套 OverviewLayout 骨架，一個詞一張卡，多次相遇合併 */
export function VocabularySection({ books }: { books: Book[] }) {
  const { vocabulary, isLoading } = useRecords();
  const { searchParams } = useUrlParams();
  const entries = filterVocabularyByLanguage(
    getVocabularyEntries(vocabulary, books),
    searchParams.get("lang") ?? "",
  );

  if (isLoading) return <PageLoading />;

  const items = entries.map(toItem);
  const headline = pickHeadline(items);
  const rest = items.filter((item) => item.id !== headline?.id);

  return (
    <OverviewLayout
      headline={headline}
      headlineLabel="最近記的"
      done={rest}
      rail={<OverviewTotalStats count={entries.length} unit="個" />}
      gridClassName={VOCABULARY_GRID}
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
            coverUrl={latest.coverUrl}
          />
        );
      }}
    />
  );
}
