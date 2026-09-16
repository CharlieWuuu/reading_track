"use client";

import { Suspense } from "react";
import { KindStatsView } from "@/app/stats/_lib/kind-stats-view";
import { BooksGate } from "@/features/books/components/books-gate";
import { KeywordsSection, KeywordView } from "@/features/keywords/components/keywords-section";
import { useUrlParams } from "@/hooks/use-url-param";

/**
 * 關鍵字多兩種看法：地圖與年代。
 *
 * 圖表與月曆跟所有類型走同一支通用頁——這一條靜態路由勝過 [slug]，
 * 所以要自己把通用的那份接回來，不然關鍵字會少掉大家都有的東西。
 *
 * 這兩種還沒通用化：地圖要經緯度、年代要起訖年，兩者都畫在自己的座標系上，
 * 跟月曆的格子不是同一回事。等第二個類型也勾了座標再抽。
 */
const OWN_VIEWS: Record<string, KeywordView> = {
  // 統計的「年代」就是關鍵字自己的 timeline；分開命名是為了不跟書籍的數線撞名
  era: "timeline",
  map: "map",
};

function KeywordsStatsView() {
  const { searchParams } = useUrlParams();
  const own = OWN_VIEWS[searchParams.get("view") ?? ""];

  if (!own) return <KindStatsView slug="keywords" />;

  return <BooksGate>{(books) => <KeywordsSection books={books} view={own} />}</BooksGate>;
}

export default function KeywordsStatsPage() {
  return (
    <Suspense fallback={null}>
      <KeywordsStatsView />
    </Suspense>
  );
}
