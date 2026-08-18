"use client";

import { useParams, useRouter } from "next/navigation";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { QuoteForm } from "@/components/notes/QuoteForm";
import { useRecordEdits } from "@/lib/recordEdits";
import { useBooks } from "@/lib/useBooks";
import { useRecords } from "@/lib/useRecords";
import { getQuoteRecords } from "@/lib/vocabularyStats";

/** 一則佳句自己的編輯頁；佳句有編號，網址上就用它 */
export default function EditQuotePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { books, isLoading: loadingBooks } = useBooks();
  const { quotes, isLoading, error } = useRecords();
  const { saveQuote } = useRecordEdits(books);

  const record = getQuoteRecords(quotes, books).find((r) => r.id === id);

  return (
    <>
      <PageHeader title="編輯佳句" backHref="/notes" />
      <PageBody>
        {isLoading || loadingBooks ? (
          <PageMessage>載入中…</PageMessage>
        ) : error || !record ? (
          <PageMessage tone={error ? "error" : "muted"}>{error || "找不到這一則"}</PageMessage>
        ) : (
          <QuoteForm record={record} onSave={saveQuote} onDone={() => router.back()} />
        )}
      </PageBody>
    </>
  );
}
