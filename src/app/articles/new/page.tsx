"use client";

import { ArticleForm } from "@/components/articles/ArticleForm";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewArticlePage() {
  return (
    <>
      <PageHeader title="新增文章" backHref="/books?type=article" />
      <PageBody>
        <div className="shrink-0 md:min-h-0 md:flex-1">
          <ArticleForm />
        </div>
      </PageBody>
    </>
  );
}
