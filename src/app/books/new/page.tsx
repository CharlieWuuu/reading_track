"use client";

import { useState } from "react";
import { BookForm } from "@/components/books/BookForm";
import { BookLookupStep, LookupResult } from "@/components/books/BookLookupStep";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewBookPage() {
  const [result, setResult] = useState<LookupResult | null>(null);

  return (
    <>
      <PageHeader title={result ? "新增書籍" : "新增書籍 · 查詢資料"} />
      {result ? (
        <div className="shrink-0 md:min-h-0 md:flex-1">
          <BookForm initial={result.prefill} notice={result.notice} />
        </div>
      ) : (
        <BookLookupStep onDone={setResult} />
      )}
    </>
  );
}
