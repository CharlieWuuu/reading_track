"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { ArticlesOverview } from "@/features/articles/components/articles-overview";
import { KindStatsBySlug } from "@/features/kinds/kind-stats-by-slug";
import { BookViewMenu } from "@/features/reading/components/book-view-menu";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { ReadingList } from "@/features/reading/components/reading-list";
import { useArticles } from "@/hooks/use-articles";
import { useBookView } from "@/hooks/use-book-view";
import { useMounted } from "@/hooks/use-mounted";
import { Article } from "@/types/article";

const ARTICLE_MODES = ["overview", "table", "card", "stats"] as const;

/** 頁首那行小字：133 篇——文章沒有重讀這回事，只有一個數字 */
function articleMeta(articles: Article[]): string {
  return `${articles.length} 篇`;
}

function ArticlesBody() {
  const mounted = useMounted();
  const { articles, isLoading, error } = useArticles();
  // 檢視方式跟書籍共用一組狀態：切分頁時看到的排列方式不會突然變
  const view = useBookView();

  if (!mounted) return null;
  if (isLoading) return <PageLoading />;
  if (error)
    return (
      <PageMessage tone="error" fill>
        {error}
      </PageMessage>
    );
  if (view === "stats") return <KindStatsBySlug slug="articles" />;
  if (view === "overview") return <ArticlesOverview />;
  return <ReadingList articles={articles} view={view} />;
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function ArticlesPage() {
  const { articles } = useArticles();

  return (
    <Suspense fallback={null}>
      <ReadingHeader
        views={<BookViewMenu cardLabel="卡片" modes={[...ARTICLE_MODES]} />}
        meta={articles.length > 0 ? articleMeta(articles) : undefined}
      />
      <PageBody>
        <ArticlesBody />
      </PageBody>
    </Suspense>
  );
}
