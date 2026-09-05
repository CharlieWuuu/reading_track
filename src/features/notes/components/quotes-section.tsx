"use client";

import { useRouter } from "next/navigation";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { quoteHref } from "@/config/routes";
import { RecordCard } from "@/features/notes/components/record-card";
import { QuoteBlock } from "@/features/notes/components/record-items";
import { useRecords } from "@/hooks/use-records";
import { Book } from "@/types/book";
import { getQuoteRecords } from "@/utils/stats/vocabulary-stats";

// 內文長度差很多，排成多欄只會高高低低；一則一列往下排反而好讀
const styles = { list: "flex flex-col divide-y divide-rule-soft" };

export function QuotesSection({ books }: { books: Book[] }) {
  const router = useRouter();
  const { quotes, isLoading } = useRecords();
  const records = getQuoteRecords(quotes, books);

  if (isLoading) return <PageLoading />;
  if (records.length === 0) return <PageMessage fill>還沒有記下任何佳句</PageMessage>;

  return (
    <div className={styles.list}>
      {records.map((record) => (
        <RecordCard
          key={record.id}
          title={record.bookTitle}
          showTitle={false}
          coverUrl={record.bookCover}
          onClick={() => router.push(quoteHref(record.id))}
        >
          <QuoteBlock quote={record} />
        </RecordCard>
      ))}
    </div>
  );
}
