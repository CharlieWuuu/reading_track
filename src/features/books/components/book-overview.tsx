"use client";

import Link from "next/link";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { Book, formatCount } from "@/types/book";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { Writing } from "@/types/writing";
import { getYearStats, pickHeadline, YearStats } from "@/utils/book-overview";
import { OverviewItem } from "@/utils/overview";
import { notesForSource } from "@/utils/related-notes";

/**
 * 書籍概覽：右側欄是書籍特有的頁數統計（總共／今年／最厚的／心得最多的），
 * 骨架（頭條＋月份格線）跟其他概覽頁共用 OverviewLayout。
 */

const styles = {
  railHead: "border-rule-strong flex items-baseline justify-between border-b pb-2",
  labelInk: "text-label text-ink tracking-label",
  meta: "text-meta text-ink-faint tabular-nums",
  railItem: "border-rule border-b py-[7px]",
  railTitle: "font-serif text-item-sm leading-snug font-semibold",
  statBlock: "border-rule border-b py-3 first:pt-0 last:border-b-0",
  statValue: "font-serif text-item leading-tight font-semibold tabular-nums",
  statCaption: "text-meta text-ink-faint",
};

const toItem = (book: Book): OverviewItem => ({
  id: book.id,
  title: book.title,
  byline: [book.author, book.pageCount && `${book.pageCount} 頁`].filter(Boolean).join("・"),
  href: "",
  coverUrl: book.coverUrl,
  startDate: book.startDate,
  endDate: book.endDate,
  kindLabel: book.domain,
});

/** 總共：小標籤、大數字、一行說明——跟「最厚的」那幾格同一套版型 */
function TotalStats({ stats }: { stats: YearStats }) {
  return (
    <div className={styles.statBlock}>
      <span className={styles.labelInk}>總共</span>
      <div className={styles.statValue}>{formatCount(String(stats.pageTotal))} 頁</div>
      <div className={styles.statCaption}>
        {stats.count > 0 ? `${stats.count} 本・平均 ${stats.pageAverage} 頁一本` : "還沒有讀完的書"}
      </div>
    </div>
  );
}

function StatsRail({ stats, href }: { stats: YearStats; href: (book: Book) => string }) {
  return (
    <div>
      <div className={styles.statBlock}>
        <span className={styles.labelInk}>今年</span>
        <div className={styles.statValue}>{formatCount(String(stats.pageTotal))} 頁</div>
        <div className={styles.statCaption}>
          {stats.count > 0
            ? `${stats.count} 本・平均 ${stats.pageAverage} 頁一本`
            : "還沒有讀完的書"}
        </div>
      </div>

      {stats.thickest && (
        <div className={styles.statBlock}>
          <span className={styles.labelInk}>最厚的</span>
          <div className={styles.statValue}>{formatCount(stats.thickest.pageCount)} 頁</div>
          <Link href={href(stats.thickest)} className={`${styles.statCaption} block truncate`}>
            {stats.thickest.title}
          </Link>
        </div>
      )}

      {stats.mostReflected && (
        <div className={styles.statBlock}>
          <span className={styles.labelInk}>心得最多的</span>
          <div className={styles.statValue}>{stats.mostReflected.count} 篇</div>
          <Link
            href={href(stats.mostReflected.book)}
            className={`${styles.statCaption} block truncate`}
          >
            {stats.mostReflected.book.title}
          </Link>
        </div>
      )}
    </div>
  );
}

function Rail({
  label,
  count,
  books,
  href,
  more,
}: {
  label: string;
  count: number;
  books: Book[];
  href: (book: Book) => string;
  more?: string;
}) {
  if (books.length === 0) return null;
  return (
    <div>
      <div className={styles.railHead}>
        <span className={styles.labelInk}>{label}</span>
        <span className={styles.meta}>{count} 本</span>
      </div>
      {books.map((book) => (
        <div key={book.id} className={styles.railItem}>
          <Link href={href(book)} className={`${styles.railTitle} line-clamp-2`}>
            {book.title}
          </Link>
          <div className={styles.meta}>{book.author}</div>
        </div>
      ))}
      {more && <span className={`${styles.meta} block pt-2`}>{more}</span>}
    </div>
  );
}

export function BookOverview({
  books,
  href,
  writings = [],
  quotes = [],
  vocabulary = [],
}: {
  books: Book[];
  href: (book: Book) => string;
  writings?: Writing[];
  quotes?: QuoteRow[];
  vocabulary?: VocabularyRow[];
}) {
  const reading = books.filter((b) => b.status === "進行");
  const want = books.filter((b) => b.status === "想要");
  const done = books.filter((b) => b.status === "完成");
  const headlineBook = pickHeadline(reading);
  const headlineNotes = headlineBook
    ? notesForSource(writings, [headlineBook.originId || headlineBook.id])
    : [];
  const yearStats = getYearStats(books, writings, new Date().getFullYear());
  const totalStats = getYearStats(books, writings);

  const doneItems: OverviewItem[] = done.map((book) => {
    const note = notesForSource(writings, [book.originId || book.id])[0];
    return {
      ...toItem(book),
      href: href(book),
      endDate: book.endDate,
      byline: note?.note ?? toItem(book).byline,
    };
  });

  let headlineItem: OverviewItem | undefined;
  if (headlineBook) {
    const quoteCount = quotes.filter((q) => q.bookId === headlineBook.id).length;
    const vocabularyCount = vocabulary.filter((v) => v.bookId === headlineBook.id).length;
    const counts = [
      quoteCount > 0 && `佳句 ${quoteCount}`,
      vocabularyCount > 0 && `單字 ${vocabularyCount}`,
      headlineNotes.length > 0 && `專欄 ${headlineNotes.length}`,
    ].filter(Boolean);
    const base = toItem(headlineBook);
    headlineItem = {
      ...base,
      href: href(headlineBook),
      byline: [base.byline, headlineBook.domain].filter(Boolean).join("・"),
      startDate: base.startDate && [`${base.startDate} 起讀`, ...counts].join("・"),
    };
  }

  return (
    <OverviewLayout
      headline={headlineItem}
      headlineLabel="在讀 · 最近開始的一本"
      headlineSummary={headlineNotes[0]?.note}
      done={doneItems}
      tintSeed={(item) => item.kindLabel}
      rail={
        <>
          <TotalStats stats={totalStats} />
          <StatsRail stats={yearStats} href={href} />
          <Rail label="進行" count={reading.length} books={reading} href={href} />
          <Rail
            label="想要"
            count={want.length}
            books={want.slice(0, 5)}
            href={href}
            more={want.length > 5 ? `看全部 ${want.length} 本 →` : undefined}
          />
        </>
      }
    />
  );
}
