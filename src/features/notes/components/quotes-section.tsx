"use client";

import { ReactNode } from "react";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewTotalStats } from "@/components/ui/overview-layout/overview-rail-stats";
import { quoteHref } from "@/config/routes";
import { useQuotesOverview } from "@/hooks/use-fragments-overview";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { Book } from "@/types/book";
import { OverviewItem, pickHeadline } from "@/utils/overview";
import {
  filterQuotesByLanguage,
  getQuoteRecords,
  QuoteRecord,
} from "@/utils/stats/vocabulary-stats";

/** 佳句一句比書籍一本占的字數多，欄數比其他概覽頁少一階，每欄才有空間放得下 */
const QUOTE_GRID = "grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-2 2xl:grid-cols-3";

const toItem = (record: QuoteRecord): OverviewItem => ({
  id: record.id,
  title: record.text,
  byline: record.bookTitle,
  href: quoteHref(record.id),
  coverUrl: record.coverUrl,
  startDate: record.date,
  endDate: record.date,
  kindLabel: "佳句",
});

function QuotesGrid({
  records,
  headlineLabel,
  rail,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: {
  records: QuoteRecord[];
  headlineLabel: string;
  rail: ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}) {
  const items = records.map(toItem);
  const headline = pickHeadline(items);
  const rest = items.filter((item) => item.id !== headline?.id);

  return (
    <OverviewLayout
      headline={headline}
      headlineLabel={headlineLabel}
      done={rest}
      rail={rail}
      gridClassName={QUOTE_GRID}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      renderItem={(item) => {
        const record = records.find((r) => r.id === item.id)!;
        return (
          <FragmentCard
            href={quoteHref(record.id)}
            title={record.text}
            meta={record.bookTitle}
            coverUrl={record.coverUrl}
          />
        );
      }}
    />
  );
}

/**
 * 佳句概覽：跟書籍頁同一套 OverviewLayout 骨架（頭條＋月份格線＋右側統計欄），
 * 只是月份格線裡一格換成 FragmentCard——佳句沒有封面清單那種畫法要的欄位。
 *
 * 有語言篩選（lang）時要整包資料在前端 filter，套不了分頁，退回整包抓取；
 * 沒有篩選才用分頁。
 */
export function QuotesSection({ books }: { books: Book[] }) {
  const { searchParams } = useUrlParams();
  const language = searchParams.get("lang") ?? "";

  if (language) return <QuotesSectionFiltered books={books} language={language} />;
  return <QuotesSectionPaged books={books} />;
}

function QuotesSectionFiltered({ books, language }: { books: Book[]; language: string }) {
  const { quotes, isLoading } = useRecords();
  const records = filterQuotesByLanguage(getQuoteRecords(quotes, books), language);

  if (isLoading) return <PageLoading />;
  if (records.length === 0) return <PageMessage fill>還沒有記下任何佳句</PageMessage>;

  return (
    <QuotesGrid
      records={records}
      headlineLabel="最新一句"
      rail={<OverviewTotalStats count={records.length} unit="句" />}
    />
  );
}

function QuotesSectionPaged({ books }: { books: Book[] }) {
  const overview = useQuotesOverview();

  if (overview.isLoading) return <PageLoading />;
  if (overview.rows.length === 0) return <PageMessage fill>還沒有記下任何佳句</PageMessage>;

  const records = getQuoteRecords(overview.rows, books);

  return (
    <QuotesGrid
      records={records}
      headlineLabel="最新一句"
      rail={<OverviewTotalStats count={overview.total} unit="句" />}
      onLoadMore={overview.loadMore}
      hasMore={overview.hasMore}
      isLoadingMore={overview.isLoadingMore}
    />
  );
}
