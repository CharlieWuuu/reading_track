"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
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

/** 一個詞一格，多次相遇合併——跟一次閱讀紀錄底下掛多則心得同一個道理，
 * 主體是詞本身。月份歸屬看最近一次相遇，那是這張卡片「最新動態」的時間 */
function toItem(entry: VocabularyEntry): OverviewItem {
  const byDate = [...entry.encounters].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const latest = byDate[0];
  const byline =
    entry.encounters.length > 1
      ? `${latest.bookTitle}等 ${entry.encounters.length} 本`
      : latest.bookTitle;

  return {
    id: entry.word,
    title: entry.word,
    byline,
    href: vocabularyHref(entry.word),
    coverUrl: latest.bookCover,
    startDate: latest.date,
    endDate: latest.date,
  };
}

export function VocabularySection({ books }: { books: Book[] }) {
  const { vocabulary, isLoading } = useRecords();
  const { searchParams } = useUrlParams();
  const entries = filterVocabularyByLanguage(
    getVocabularyEntries(vocabulary, books),
    searchParams.get("lang") ?? "",
  );

  if (isLoading) return <PageLoading />;

  const items = entries.map(toItem);
  const headline = pickHeadline(items.filter((item) => item.startDate));

  return (
    <OverviewLayout
      headline={headline}
      headlineLabel="最近記下的一個字"
      done={items}
      tintSeed={(item) => item.title}
    />
  );
}
