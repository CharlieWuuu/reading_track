"use client";

import { Suspense } from "react";
import { resolveView } from "@/config/stats-views";
import { BooksGate } from "@/features/books/components/books-gate";
import { KeywordsSection, KeywordView } from "@/features/keywords/components/keywords-section";
import { useUrlParams } from "@/hooks/use-url-param";

/** 統計的「年代」就是關鍵字自己的 timeline；分開命名是為了不跟書籍的數線撞名 */
const KEYWORD_VIEW: Record<string, KeywordView> = {
  chart: "chart",
  map: "map",
  era: "timeline",
};

function KeywordsStatsView() {
  const { searchParams } = useUrlParams();
  const view = resolveView("keywords", searchParams.get("view"));

  return (
    <BooksGate>
      {(books) => <KeywordsSection books={books} view={KEYWORD_VIEW[view] ?? "chart"} />}
    </BooksGate>
  );
}

export default function KeywordsStatsPage() {
  return (
    <Suspense fallback={null}>
      <KeywordsStatsView />
    </Suspense>
  );
}
