"use client";

import { FRAGMENT_CARD_GRID, FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewTotalStats } from "@/components/ui/overview-layout/overview-rail-stats";
import { keywordHref } from "@/config/routes";
import { useKeywordInfos } from "@/features/keywords/api/use-keyword-infos";
import { getKeywordEntries, KeywordEntry } from "@/features/keywords/utils/keyword-stats";
import { Book } from "@/types/book";
import { OverviewItem, pickHeadline } from "@/utils/overview";

const styles = {
  empty: "py-6 text-center text-xs text-gray-400",
};

/**
 * 關鍵字卡片牆：關鍵字頁與手機的筆記頁共用，點一張就進那個字的詳情頁。
 *
 * 關鍵字本身沒有「發生時間」（是從書籍的 keywords 欄拆出來的），用主檔的
 * created_at（第一次被記下的時間）近似當作它的日期，套進跟書籍頁一樣的
 * OverviewLayout 骨架（頭條＋月份格線＋右側統計欄）。
 */
export function KeywordCards({ books }: { books: Book[] }) {
  const { byName } = useKeywordInfos();
  const entries = getKeywordEntries(books, [...byName.keys()]);

  if (entries.length === 0) {
    return <div className={styles.empty}>還沒有任何關鍵字</div>;
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

  // getKeywordEntries 照書數排，月份格線要的是日期序；沒建立時間的排最後
  const items = entries
    .map(toItem)
    .sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? ""));
  const headline = pickHeadline(items);

  return (
    <OverviewLayout
      headline={headline}
      headlineLabel="最新一筆"
      done={items}
      rail={<OverviewTotalStats count={entries.length} unit="個" />}
      gridClassName={FRAGMENT_CARD_GRID}
      renderItem={(item) => {
        const entry = entries.find((e) => e.name === item.id)!;
        const info = byName.get(entry.name);

        return (
          <FragmentCard title={entry.name} href={keywordHref(entry.name)} body={info?.summary} />
        );
      }}
    />
  );
}
