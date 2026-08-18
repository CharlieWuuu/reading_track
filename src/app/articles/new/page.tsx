"use client";

import { Suspense } from "react";
import { ArticleForm } from "@/components/articles/ArticleForm";
import { ArticleFormTabs } from "@/components/articles/ArticleFormTabs";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";

function NewArticle() {
  return (
    <>
      <PageHeader title="新增文章" backHref="/books?type=article" action={<ArticleFormTabs />} />
      <PageBody>
        <div className="shrink-0 md:min-h-0 md:flex-1">
          <ArticleForm />
        </div>
      </PageBody>
    </>
  );
}

/** 分頁列與表單都讀網址參數，整頁包一層 Suspense，靜態預先產生才不會失敗 */
export default function NewArticlePage() {
  return (
    <Suspense fallback={null}>
      <NewArticle />
    </Suspense>
  );
}
