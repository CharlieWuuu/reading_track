"use client";

import { Suspense } from "react";
import { KeywordsSection } from "@/components/keywords/KeywordsSection";
import { BooksGate } from "@/components/layout/BooksGate";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";

/** 關鍵字也是筆記頁的一個分頁，內容共用 KeywordsSection，兩邊看到的一樣 */
function Keywords() {
  return (
    <>
      <PageHeader title="關鍵字" />
      <PageBody>
        <BooksGate>{(books) => <KeywordsSection books={books} />}</BooksGate>
      </PageBody>
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function KeywordsPage() {
  return (
    <Suspense fallback={null}>
      <Keywords />
    </Suspense>
  );
}
