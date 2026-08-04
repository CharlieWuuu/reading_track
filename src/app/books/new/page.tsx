"use client";

import { useState } from "react";
import { BookForm } from "@/components/books/BookForm";
import { BookLookupStep, LookupResult } from "@/components/books/BookLookupStep";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewBookPage() {
  const [result, setResult] = useState<LookupResult | null>(null);

  return (
    <div
      className={`mx-auto flex w-full min-h-0 flex-1 flex-col gap-3 md:gap-5 ${result ? "max-w-5xl" : "max-w-3xl"}`}
    >
      <PageHeader title={result ? "新增書籍" : "新增書籍 · 查詢資料"} />
      {result ? (
        <div className="min-h-0 flex-1">
          <BookForm initial={result.prefill} notice={result.notice} />
        </div>
      ) : (
        <BookLookupStep onDone={setResult} />
      )}
    </div>
  );
}
