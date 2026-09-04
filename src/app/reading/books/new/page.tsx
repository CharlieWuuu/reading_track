"use client";

import { Suspense, useState } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { BookForm } from "@/features/books/components/book-form";
import { BookFormTabs } from "@/features/books/components/book-form-tabs";
import { BookLookupStep, LookupResult } from "@/features/books/components/book-lookup-step";
import { BookRefetchButton } from "@/features/books/components/book-refetch-button";
import { useUrlParams } from "@/hooks/use-url-param";

function NewBook() {
  const [result, setResult] = useState<LookupResult | null>(null);
  // 從書單進來時帶著檢視方式與頁碼，返回要回到同一頁
  const { searchParams } = useUrlParams();
  const back = searchParams.get("back");
  const backHref = back ? `/reading/books?${back}` : "/reading/books";

  return (
    <>
      {/* 還在查詢資料時沒有表單可切，分頁列等填表那一步才出現 */}
      <PageHeader
        title="新增書籍"
        backHref={backHref}
        action={
          result ? (
            <div className="flex min-w-0 items-center gap-2">
              <BookRefetchButton />
              <BookFormTabs />
            </div>
          ) : undefined
        }
      />
      <PageBody>
        {result ? (
          <div className="shrink-0 md:min-h-0 md:flex-1">
            <BookForm initial={result.prefill} notice={result.notice} />
          </div>
        ) : (
          <BookLookupStep onDone={setResult} />
        )}
      </PageBody>
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function NewBookPage() {
  return (
    <Suspense fallback={null}>
      <NewBook />
    </Suspense>
  );
}
