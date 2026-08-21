"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageMessage } from "@/components/layout/page-message";
import { LibraryHeader } from "@/features/library/components/library-header";
import { ReadingList } from "@/features/library/components/reading-list";
import { useArticles } from "@/hooks/use-articles";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { isBookViewMode, useBookViewStore } from "@/stores/use-book-view-store";
import { matchesSearch, searchTerms } from "@/utils/search";

function ArticlesBody() {
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

  return (
    <>
      <LibraryHeader current="article" />
      <PageBody>
        {isLoading ? (
          <PageMessage>載入中…</PageMessage>
        ) : error ? (
          <PageMessage tone="error">{error}</PageMessage>
        ) : found.length === 0 && terms.length > 0 ? (
          <PageMessage>沒有符合的文章</PageMessage>
        ) : (
          <ReadingList articles={found} view={view} />
        )}
      </PageBody>
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesBody />
    </Suspense>
  );
}
