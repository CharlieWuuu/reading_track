"use client";

import { useParams, useRouter } from "next/navigation";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { kindHref } from "@/config/kind-routes";
import { quoteHref } from "@/config/routes";
import { QuoteForm } from "@/features/notes/components/quote-form";
import { useBooks } from "@/hooks/use-books";
import { useRecordEdits } from "@/hooks/use-record-edits";
import { useRecords } from "@/hooks/use-records";
import { getQuoteRecords } from "@/utils/stats/vocabulary-stats";

/** 一則佳句自己的編輯頁；佳句有編號，網址上就用它 */
export default function EditQuotePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { books, isLoading: loadingBooks } = useBooks();
  const { quotes, isLoading, error } = useRecords();
  const { saveQuote } = useRecordEdits(books);

  const record = getQuoteRecords(quotes, books).find((r) => r.id === id);
  const recordLabel =
    record && (record.bookTitle.length > 5 ? `${record.bookTitle.slice(0, 5)}…` : record.bookTitle);

  return (
    <>
      <PageHeader
        title="編輯"
        size="compact"
        parent={[
          { label: "片段", href: "/fragments" },
          { label: "佳句", href: kindHref("fragments", "quotes") },
          ...(recordLabel ? [{ label: recordLabel, href: quoteHref(id) }] : []),
        ]}
        backHref={kindHref("fragments", "quotes")}
      />
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
