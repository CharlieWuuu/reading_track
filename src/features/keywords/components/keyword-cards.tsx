"use client";

import { FRAGMENT_CARD_GRID, FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewRailList } from "@/components/ui/overview-layout/overview-rail-stats";
import { keywordHref } from "@/config/routes";
import { useKeywordInfos } from "@/features/keywords/api/use-keyword-infos";
import { getKeywordEntries, KeywordEntry } from "@/features/keywords/utils/keyword-stats";
import { topicLabel } from "@/features/keywords/utils/topic-labels";
import { Book } from "@/types/book";
import { OverviewItem, pickHeadline, topBookSources, topKeywordsFromBooks } from "@/utils/overview";
import { tagColorClass } from "@/utils/tag-colors";

const styles = {
  empty: "py-6 text-center text-xs text-gray-400",
  topic: "rounded-control px-1.5 py-0.5 text-[11px] font-medium",
  count: "shrink-0 text-xs text-gray-400 tabular-nums",
};

const RAIL_LIST_SIZE = 5;

/** 出處排行：哪本書掛的關鍵字最多；常一起出現：這些書上還掛了哪些別的關鍵字 */
function KeywordsRail({ entries, books }: { entries: KeywordEntry[]; books: Book[] }) {
  const bookIds = entries.flatMap((entry) => entry.books.map((book) => book.id));
  const sources = topBookSources(bookIds, books, "個", RAIL_LIST_SIZE);

  const own = new Set(entries.map((entry) => entry.name));
  const related = topKeywordsFromBooks(bookIds, books, "本", RAIL_LIST_SIZE + own.size).filter(
    (item) => !own.has(item.title),
  );

  return (
    <>
      <OverviewRailList label="出處排行" count={sources.length} items={sources} />
      <OverviewRailList
        label="常一起出現的關鍵字"
        count={related.length}
        items={related.slice(0, RAIL_LIST_SIZE)}
      />
    </>
  );
}

/**
 * 關鍵字卡片牆：關鍵字頁與手機的筆記頁共用，點一張就進那個字的詳情頁。
 *
 * 關鍵字本身沒有「發生時間」（是從書籍的 keywords 欄拆出來的），用主檔的
 * created_at（第一次被記下的時間）近似當作它的日期，套進跟書籍頁一樣的
 * OverviewLayout 骨架（頭條＋月份格線＋右側統計欄）。
 */
export function KeywordCards({ books }: { books: Book[] }) {
  const { byName } = useKeywordInfos();
  const entries = getKeywordEntries(books);

  if (entries.length === 0) {
    return <div className={styles.empty}>還沒有任何關鍵字，先到書籍的「關鍵字」欄記幾個</div>;
  }

  const toItem = (entry: KeywordEntry): OverviewItem => {
    const info = byName.get(entry.name);
    const day = info?.createdAt?.slice(0, 10) || null;
    return {
      id: entry.name,
      title: entry.name,
      byline: info?.summary ?? "",
      href: keywordHref(entry.name),
      startDate: day,
      endDate: day,
    };
  };

  const items = entries.map(toItem);
  const headline = pickHeadline(items);
  const rest = items.filter((item) => item.id !== headline?.id);

  return (
    <OverviewLayout
      headline={headline}
      headlineLabel="最近記的"
      done={rest}
      rail={<KeywordsRail entries={entries} books={books} />}
      gridClassName={FRAGMENT_CARD_GRID}
      renderItem={(item) => {
        const entry = entries.find((e) => e.name === item.id)!;
        const info = byName.get(entry.name);
        const tags = info?.tags ? info.tags.split("、").filter(Boolean).map(topicLabel) : [];

        return (
          <FragmentCard
            title={entry.name}
            href={keywordHref(entry.name)}
            labelExtra={
              <>
                {tags.map((tag) => (
                  <span key={tag} className={`${styles.topic} ${tagColorClass(tag, [])}`}>
                    {tag}
                  </span>
                ))}
                {entry.books.length > 1 && (
                  <span className={styles.count}>{entry.books.length} 本</span>
                )}
              </>
            }
            detail={info?.span}
            body={info?.summary}
          />
        );
      }}
    />
  );
}
