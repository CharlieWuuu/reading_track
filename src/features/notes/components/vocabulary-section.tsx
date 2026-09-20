"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { FRAGMENT_CARD_GRID, FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { GroupTable } from "@/components/ui/group-table/group-table";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewTotalStats } from "@/components/ui/overview-layout/overview-rail-stats";
import { kindHref } from "@/config/kind-routes";
import { useKinds } from "@/hooks/use-kinds";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { Book } from "@/types/book";
import { OverviewItem, pickHeadline } from "@/utils/overview";
import {
  filterVocabularyByLanguage,
  getVocabularyEntries,
  VocabularyEntry,
} from "@/utils/stats/vocabulary-stats";

/**
 * 連到那一列自己的編號，不是用詞當網址。
 *
 * 詞網址配的是已經拆掉的專屬頁（手寫七格、不讀模組設定）；通用詳情頁拿詞
 * 去查會查不到，畫面卡在載入中。資料本來就一列一筆，直接用它的 id。
 */
function hrefOf(entry: VocabularyEntry): string {
  return `${kindHref("fragments", "vocabulary")}/${entry.encounters[0]?.id ?? ""}`;
}

function latestOf(entry: VocabularyEntry) {
  return [...entry.encounters].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))[0];
}

function toItem(entry: VocabularyEntry): OverviewItem {
  const latest = latestOf(entry);
  return {
    id: entry.word,
    title: entry.word,
    byline: latest.example,
    href: hrefOf(entry),
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
  const { kinds } = useKinds();
  const { searchParams } = useUrlParams();
  // 出處與書封都看同一個開關：類型自己說要不要沿用出處的東西，不在畫面層寫死。
  // 單字預設不繼承——一個詞不屬於任何一本書，掛書名跟掛書封是同一種誤導
  const inheritsCover = kinds.find((kind) => kind.slug === "vocabulary")?.inheritsCover ?? false;
  const entries = filterVocabularyByLanguage(
    getVocabularyEntries(vocabulary, books),
    searchParams.get("lang") ?? "",
  );

  if (isLoading) return <PageLoading />;

  const items = entries.map(toItem);

  if (view === "table") return <GroupTable items={items} onSaved={mutate} />;

  const headline = pickHeadline(items);

  return (
    <OverviewLayout
      headline={headline}
      headlineLabel="最近記的"
      done={items}
      rail={<OverviewTotalStats count={entries.length} unit="個" />}
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
            href={hrefOf(entry)}
            title={entry.word}
            label={translation}
            detail={pronunciation}
            body={latest.example}
            meta={
              inheritsCover ? [latest.bookTitle, latest.chapter].filter(Boolean).join("・") : ""
            }
            coverUrl={inheritsCover ? latest.bookCover : undefined}
          />
        );
      }}
    />
  );
}
