"use client";

import { useState } from "react";
import { BookForm } from "@/components/books/BookForm";
import { BookLookupStep, LookupResult } from "@/components/books/BookLookupStep";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewBookPage() {
  const [result, setResult] = useState<LookupResult | null>(null);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={result ? "新增書籍" : "新增書籍 · 查詢資料"} />
      {result ? (
        <BookForm initial={result.prefill} notice={result.notice} />
      ) : (
        <BookLookupStep onDone={setResult} />
      )}
    </div>
  );
}
