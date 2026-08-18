"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { ArticleForm } from "@/components/articles/ArticleForm";
import { ArticleFormTabs } from "@/components/articles/ArticleFormTabs";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { useArticles } from "@/lib/useArticles";
import { useSheetStore } from "@/store/useSheetStore";

function EditArticle() {
  const { id } = useParams<{ id: string }>();
  const { sheetId } = useSheetStore();
  const { articles, isLoading, error } = useArticles();
  const article = articles.find((a) => a.id === id);

  if (!sheetId || isLoading || error || !article) {
    return (
      <>
        <PageHeader title="編輯文章" backHref="/books?type=article" />
        <PageMessage tone={error ? "error" : "muted"}>
          {!sheetId
            ? "請先到「設定」頁面連接 Google Sheet"
            : isLoading
              ? "載入中…"
              : error || "找不到這篇文章"}
        </PageMessage>
      </>
    );
  }

  return (
    <>
      <PageHeader title="編輯文章" backHref="/books?type=article" action={<ArticleFormTabs />} />
      <PageBody>
        <div className="shrink-0 md:min-h-0 md:flex-1">
          <ArticleForm key={article.id} article={article} />
        </div>
      </PageBody>
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function EditArticlePage() {
  return (
    <Suspense fallback={null}>
      <EditArticle />
    </Suspense>
  );
}
