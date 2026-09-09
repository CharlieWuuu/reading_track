"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { ArticlesOverview } from "@/features/articles/components/articles-overview";
import { BookViewMenu } from "@/features/reading/components/book-view-menu";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { ReadingList } from "@/features/reading/components/reading-list";
import { useArticles } from "@/hooks/use-articles";
import { useBookView } from "@/hooks/use-book-view";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { Article } from "@/types/article";
import { matchesSearch, searchTerms } from "@/utils/search";

const ARTICLE_MODES = ["overview", "table", "card"] as const;

/** 頁首那行小字：133 篇——文章沒有重讀這回事，只有一個數字 */
function articleMeta(articles: Article[]): string {
  return `${articles.length} 篇`;
}

function ArticlesBody() {
  const mounted = useMounted();
  const { articles, isLoading, error } = useArticles();
  const { searchParams } = useUrlParams();
  // 檢視方式跟書籍共用一組狀態：切分頁時看到的排列方式不會突然變
  const view = useBookView();

  const terms = searchTerms(searchParams.get("q") ?? "");
  const found = articles.filter((a) =>
    matchesSearch(terms, a.title, a.author, a.platform, a.keywords, a.note),
  );

  if (!mounted) return null;
  if (isLoading) return <PageLoading />;
  if (error)
    return (
      <PageMessage tone="error" fill>
        {error}
      </PageMessage>
    );
  if (found.length === 0 && terms.length > 0) return <PageMessage fill>沒有符合的文章</PageMessage>;

  if (view === "overview") return <ArticlesOverview articles={found} />;
  return <ReadingList articles={found} view={view} />;
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function ArticlesPage() {
  const { articles } = useArticles();
  const view = useBookView();

  return (
    <Suspense fallback={null}>
      <ReadingHeader
        views={<BookViewMenu cardLabel="卡片" modes={[...ARTICLE_MODES]} />}
        meta={articles.length > 0 ? articleMeta(articles) : undefined}
      />
      {/* 概覽自己開兩欄各自的捲動條（月份格線＋窄欄），其餘檢視照舊交給 PageBody */}
      <PageBody scroll={view !== "overview"}>
        <ArticlesBody />
      </PageBody>
    </Suspense>
  );
}
