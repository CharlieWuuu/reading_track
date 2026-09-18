"use client";

import { PageMessage } from "@/components/layout/page-message";
import { useKeywordInfos } from "@/features/keywords/api/use-keyword-infos";
import { KeywordCards } from "@/features/keywords/components/keyword-cards";
import { getKeywordEntries } from "@/features/keywords/utils/keyword-stats";
import { Book } from "@/types/book";

/**
 * 關鍵字的卡片牆。閱讀那一頁是拿來翻的，不是拿來看分布的。
 *
 * 分析型的三種（圖表、地圖、年代）搬進統計了：地圖與年代現在讀的是
 * 這個類型自己的座標與起訖年（見 utils/stats/geo-stats），一筆一個點，
 * 不再是「一本書一個顏色」——影集哪天勾了座標，一樣畫得出來。
 */
export function KeywordsSection({ books }: { books: Book[] }) {
  const { byName } = useKeywordInfos();

  const entries = getKeywordEntries(books, [...byName.keys()]);
  if (entries.length === 0) {
    return <PageMessage fill>還沒有任何關鍵字</PageMessage>;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <KeywordCards books={books} />
    </div>
  );
}
