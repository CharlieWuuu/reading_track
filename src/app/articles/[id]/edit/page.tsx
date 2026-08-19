"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { ArticleForm } from "@/components/articles/ArticleForm";
import { ArticleFormTabs } from "@/components/articles/ArticleFormTabs";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { RecordGate } from "@/components/layout/RecordGate";
import { useArticles } from "@/lib/useArticles";

function EditArticle() {
  const { id } = useParams<{ id: string }>();
  const { articles, isLoading, error } = useArticles();
  const article = articles.find((a) => a.id === id);

  return (
    <>
      <PageHeader
        title="編輯文章"
        backHref="/books?type=article"
        action={article && <ArticleFormTabs />}
      />
      <PageBody>
        <RecordGate loading={isLoading} error={error} missing={!article && "找不到這篇文章"}>
          <div className="shrink-0 md:min-h-0 md:flex-1">
            <ArticleForm key={article?.id} article={article} />
          </div>
        </RecordGate>
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
