"use client";

import { Suspense, useState } from "react";
import { BookForm } from "@/components/books/BookForm";
import { BookLookupStep, LookupResult } from "@/components/books/BookLookupStep";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { useUrlParams } from "@/lib/useUrlParam";

function NewBook() {
  const [result, setResult] = useState<LookupResult | null>(null);
  // 從書單進來時帶著檢視方式與頁碼，返回要回到同一頁
  const { searchParams } = useUrlParams();
  const back = searchParams.get("back");
  const backHref = back ? `/books?${back}` : "/books";

  return (
    <>
      <PageHeader title="新增書籍" backHref={backHref} />
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
