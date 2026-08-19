"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { ArticleForm } from "@/features/articles/components/article-form";
import { ArticleFormTabs } from "@/features/articles/components/article-form-tabs";

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
