"use client";

import { DataGate } from "@/components/layout/data-gate";
import { SectionList } from "@/features/stats/components/section-list";
import { useArticleSections } from "@/features/stats/hooks/use-article-sections";
import { useArticles } from "@/hooks/use-articles";

export function ArticlesStats() {
  const { articles, isLoading, error } = useArticles();
  const sections = useArticleSections(articles);

  return (
    <DataGate
      isLoading={isLoading}
      error={error}
      isEmpty={articles.length === 0}
      emptyText="尚無文章"
    >
      <SectionList sections={sections} />
    </DataGate>
  );
}
