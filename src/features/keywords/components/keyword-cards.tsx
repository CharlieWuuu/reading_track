"use client";

import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewTotalStats } from "@/components/ui/overview-layout/overview-rail-stats";
import { keywordHref } from "@/config/routes";
import { useKeywordInfos } from "@/features/keywords/api/use-keyword-infos";
import { getKeywordEntries, KeywordEntry } from "@/features/keywords/utils/keyword-stats";
import { topicLabel } from "@/features/keywords/utils/topic-labels";
import { Book } from "@/types/book";
import { OverviewItem, pickHeadline } from "@/utils/overview";
import { tagColorClass } from "@/utils/tag-colors";

const styles = {
  empty: "py-6 text-center text-xs text-gray-400",
  topic: "rounded-control px-1.5 py-0.5 text-[11px] font-medium",
  count: "shrink-0 text-xs text-gray-400 tabular-nums",
};

/** 一個關鍵字連摘要一起占的字數比書籍一本多，欄數比其他概覽頁少一階，每欄才有空間放得下 */
const KEYWORD_GRID = "grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-2 2xl:grid-cols-3";

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
      kindLabel: "關鍵字",
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
      rail={<OverviewTotalStats count={entries.length} unit="個" />}
      gridClassName={KEYWORD_GRID}
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
