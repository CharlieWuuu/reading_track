"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { quoteHref } from "@/config/routes";
import { useRecords } from "@/hooks/use-records";
import { Book } from "@/types/book";
import { OverviewItem, pickHeadline } from "@/utils/overview";
import { getQuoteRecords } from "@/utils/stats/vocabulary-stats";

/** 佳句概覽：每格放佳句前幾字＋書名，跟其他概覽頁共用 OverviewLayout 骨架 */
export function QuotesSection({ books }: { books: Book[] }) {
  const { quotes, isLoading } = useRecords();
  const records = getQuoteRecords(quotes, books);

  if (isLoading) return <PageLoading />;
  if (records.length === 0) return <PageMessage fill>還沒有記下任何佳句</PageMessage>;

  const items: OverviewItem[] = records.map((record) => ({
    id: record.id,
    title: record.text.slice(0, 40),
    byline: record.bookTitle,
    href: quoteHref(record.id),
    coverUrl: record.bookCover,
    startDate: record.date,
    endDate: record.date,
  }));

  const headline = pickHeadline(items.filter((item) => item.startDate));

  return (
    <OverviewLayout
      headline={headline}
      headlineLabel="最近記下的一句"
      done={items}
      tintSeed={(item) => item.byline}
    />
  );
}
