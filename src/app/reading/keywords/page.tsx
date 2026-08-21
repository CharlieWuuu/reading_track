"use client";

import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { BooksGate } from "@/features/books/components/books-gate";
import { KEYWORD_VIEWS, KeywordsSection } from "@/features/keywords/components/keywords-section";
import { ReadingHeader } from "@/features/reading/components/reading-header";
import { useUrlParams } from "@/hooks/use-url-param";

function KeywordsBody() {
  const router = useRouter();
  const { searchParams } = useUrlParams();
  // 選單裡標粗體的是「正在看的那一種」，所以直接讀網址：沒選過就四個都一樣
  const view = searchParams.get("view") ?? "";

  return (
    <>
      <ReadingHeader
        menu={{
          items: KEYWORD_VIEWS,
          value: view,
          onChange: (next) => router.push(`/reading/keywords?view=${encodeURIComponent(next)}`),
        }}
      />
      <PageBody>
        <BooksGate>{(books) => <KeywordsSection books={books} showSwitch={false} />}</BooksGate>
      </PageBody>
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function KeywordsPage() {
  return (
    <Suspense fallback={null}>
      <KeywordsBody />
    </Suspense>
  );
}
