"use client";

import { PageMessage } from "@/components/layout/page-message";
import { ReadingList } from "@/features/reading/components/reading-list";
import { useArticles } from "@/hooks/use-articles";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { isBookViewMode, useBookViewStore } from "@/stores/use-book-view-store";
import { matchesSearch, searchTerms } from "@/utils/search";

export default function ArticlesPage() {
  const mounted = useMounted();
  const { articles, isLoading, error } = useArticles();
  const { searchParams } = useUrlParams();
  // 檢視方式跟書籍共用一組狀態：切分頁時看到的排列方式不會突然變
  const { view: savedView } = useBookViewStore();
  const urlView = searchParams.get("view");
  const view = isBookViewMode(urlView) ? urlView : savedView;

  const terms = searchTerms(searchParams.get("q") ?? "");
  const found = articles.filter((a) =>
    matchesSearch(terms, a.title, a.author, a.platform, a.keywords, a.note),
  );

  if (!mounted) return null;
  if (isLoading) return <PageMessage>載入中…</PageMessage>;
  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (found.length === 0 && terms.length > 0) return <PageMessage>沒有符合的文章</PageMessage>;

  return <ReadingList articles={found} view={view} />;
}
