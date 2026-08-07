"use client";

import { useState } from "react";
import { BookForm } from "@/components/books/BookForm";
import { BookLookupStep, LookupResult } from "@/components/books/BookLookupStep";
import { PageShell } from "@/components/layout/PageShell";

export default function NewBookPage() {
  const [result, setResult] = useState<LookupResult | null>(null);

  return (
    // 查詢階段只有一個輸入框，用窄版；填表階段欄位多，放寬
    <PageShell
      title={result ? "新增書籍" : "新增書籍 · 查詢資料"}
      fill
    >
      {result ? (
        <div className="min-h-0 flex-1">
          <BookForm initial={result.prefill} notice={result.notice} />
        </div>
      ) : (
        <BookLookupStep onDone={setResult} />
      )}
    </PageShell>
  );
}
