"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { SectionList } from "@/features/stats/components/section-list";
import { useArticleSections } from "@/features/stats/hooks/use-article-sections";
import { useArticles } from "@/hooks/use-articles";
import { useMounted } from "@/hooks/use-mounted";
import { useSheetStore } from "@/stores/use-sheet-store";

export function ArticlesStats() {
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { articles, isLoading, error } = useArticles();

  const sections = useArticleSections(articles);

  if (!mounted) return null;

  if (!sheetId) {
    return <PageMessage>請先到「設定」頁面連接 Google Sheet</PageMessage>;
  }

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageMessage tone="error">{error}</PageMessage>;
  }

  if (articles.length === 0) {
    return <PageMessage>尚無文章</PageMessage>;
  }

  return <SectionList sections={sections} />;
}
