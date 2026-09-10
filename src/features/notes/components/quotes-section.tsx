"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewTotalStats } from "@/components/ui/overview-layout/overview-rail-stats";
import { quoteHref } from "@/config/routes";
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
  coverUrl: record.bookCover,
  startDate: record.date,
  endDate: record.date,
  kindLabel: "佳句",
});

/**
 * 佳句概覽：跟書籍頁同一套 OverviewLayout 骨架（頭條＋月份格線＋右側統計欄），
 * 只是月份格線裡一格換成 FragmentCard——佳句沒有封面清單那種畫法要的欄位。
 */
export function QuotesSection({ books }: { books: Book[] }) {
  const { quotes, isLoading } = useRecords();
  const { searchParams } = useUrlParams();
  const language = searchParams.get("lang") ?? "";

  const records = filterQuotesByLanguage(getQuoteRecords(quotes, books), language);

  if (isLoading) return <PageLoading />;
  if (records.length === 0) return <PageMessage fill>還沒有記下任何佳句</PageMessage>;

  const items = records.map(toItem);
  const headline = pickHeadline(items);
  const rest = items.filter((item) => item.id !== headline?.id);

  return (
    <OverviewLayout
      headline={headline}
      headlineLabel="最新一句"
      done={rest}
      rail={<OverviewTotalStats count={records.length} unit="句" />}
      gridClassName={QUOTE_GRID}
      renderItem={(item) => {
        const record = records.find((r) => r.id === item.id)!;
        return (
          <FragmentCard href={quoteHref(record.id)} title={record.text} meta={record.bookTitle} />
        );
      }}
    />
  );
}
