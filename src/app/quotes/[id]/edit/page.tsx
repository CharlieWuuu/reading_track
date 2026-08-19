"use client";

import { useParams, useRouter } from "next/navigation";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { RecordGate } from "@/components/layout/RecordGate";
import { QuoteForm } from "@/features/notes/components/quote-form";
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
      <PageHeader title="編輯佳句" backHref="/notes?tab=quotes" />
      <PageBody>
        <RecordGate
          loading={isLoading || loadingBooks}
          error={error}
          missing={!record && "找不到這一則"}
        >
          {record && <QuoteForm record={record} onSave={saveQuote} onDone={() => router.back()} />}
        </RecordGate>
      </PageBody>
    </>
  );
}
