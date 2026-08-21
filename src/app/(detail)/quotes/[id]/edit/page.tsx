"use client";

import { useParams, useRouter } from "next/navigation";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { QuoteForm } from "@/features/notes/components/quote-form";
import { useBooks } from "@/hooks/use-books";
import { useRecordEdits } from "@/hooks/use-record-edits";
import { useRecords } from "@/hooks/use-records";
import { getQuoteRecords } from "@/utils/vocabulary-stats";

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
