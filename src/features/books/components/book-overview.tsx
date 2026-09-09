"use client";

import Link from "next/link";
import { BookCover } from "@/components/ui/book-cover";
import { CoverBand } from "@/components/ui/cover-band/cover-band";
import { Book, formatCount } from "@/types/book";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { Writing } from "@/types/writing";
import { byMonth, getYearStats, pickHeadline, YearStats } from "@/utils/book-overview";
import { notesForSource } from "@/utils/related-notes";

/**
 * 概覽：一頁只有一個主角。
 *
 * 最近在讀的那一本放成頭條，其餘在讀與想讀收進右邊的窄欄，讀完的照月份
 * 排成三欄。分隔全部用線，不用卡片框——這是報紙的做法，同樣的資訊量佔的
 * 空間比卡片少一半。
 */

const styles = {
  frame: "flex min-h-0 min-w-0 flex-1 gap-8",
  // 自己的捲動條：中間月份格線很長，右邊窄欄通常很短，兩邊各捲各的，
  // 不要因為其中一邊比較長就把另一邊也拖走
  main: "flex min-w-0 flex-1 flex-col overflow-y-auto",
  rail: "border-rule-strong hidden w-52 shrink-0 overflow-y-auto border-l pl-6 lg:block",
  railHead: "border-rule-strong flex items-baseline justify-between border-b pb-2",
  label: "text-label text-accent tracking-label font-medium",
  labelInk: "text-label text-ink tracking-label",
  meta: "text-meta text-ink-faint tabular-nums",
  headline: "border-rule-strong flex gap-8 border-b pb-5",
  headlineTitle: "font-serif text-lede leading-tight font-semibold tracking-tight",
  byline: "text-byline text-ink-muted",
  summary: "text-byline text-ink leading-relaxed",
  // 欄數跟著寬度長，每欄寬度才不會沒有上限一直被拉開
  monthGrid: "grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
  month: "border-rule-strong border-b pt-4 pb-1.5",
  monthLabel: "font-serif text-item-sm font-semibold tracking-wide",
  item: "py-3",
  itemTitle: "font-serif text-item leading-snug font-semibold tracking-tight",
  railItem: "border-rule border-b py-[7px]",
  railTitle: "font-serif text-item-sm leading-snug font-semibold",
  statBlock: "border-rule border-b py-3 first:pt-0 last:border-b-0",
  statValue: "font-serif text-item leading-tight font-semibold tabular-nums",
  statCaption: "text-meta text-ink-faint",
};

function Headline({
  book,
  href,
  latestNote,
  quoteCount,
  vocabularyCount,
  noteCount,
}: {
  book: Book;
  href: string;
  latestNote?: Writing;
  quoteCount: number;
  vocabularyCount: number;
  noteCount: number;
}) {
  const counts = [
    quoteCount > 0 && `佳句 ${quoteCount}`,
    vocabularyCount > 0 && `單字 ${vocabularyCount}`,
    noteCount > 0 && `專欄 ${noteCount}`,
  ].filter(Boolean);

  return (
    <div className={styles.headline}>
      <div className="w-28.75 shrink-0">
        <BookCover url={book.coverUrl} title={book.title} size="full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className={styles.label}>在讀 · 最近開始的一本</span>
        <Link href={href} className={`${styles.headlineTitle} truncate`}>
          {book.title}
        </Link>
        <span className={styles.byline}>
          {[book.author, book.domain, book.pageCount && `${book.pageCount} 頁`]
            .filter(Boolean)
            .join("　·　")}
        </span>
        {latestNote && <p className={`${styles.summary} line-clamp-2`}>{latestNote.note}</p>}
        {(book.startDate || counts.length > 0) && (
          <span className={styles.meta}>
            {[book.startDate && `${book.startDate} 起讀`, ...counts].filter(Boolean).join("　·　")}
          </span>
        )}
      </div>
    </div>
  );
}

function StatsRail({ stats, href }: { stats: YearStats; href: (book: Book) => string }) {
  const year = new Date().getFullYear();
  return (
    <div className="pb-8">
      <div className={styles.railHead}>
        <span className={styles.labelInk}>今年</span>
        <span className={styles.meta}>{stats.count} 本</span>
      </div>

      <div className={styles.statBlock}>
        <div className={styles.statValue}>{formatCount(String(stats.pageTotal))} 頁</div>
        {stats.count > 0 && (
          <div className={styles.statCaption}>平均 {stats.pageAverage} 頁一本</div>
        )}
      </div>

      {stats.thickest && (
        <div className={styles.statBlock}>
          <div className={styles.labelInk}>最厚的</div>
          <Link href={href(stats.thickest)} className={`${styles.statCaption} block truncate`}>
            {stats.thickest.title}　·　{formatCount(stats.thickest.pageCount)} 頁
          </Link>
        </div>
      )}

      {stats.fastest && (
        <div className={styles.statBlock}>
          <div className={styles.labelInk}>最快讀完的</div>
          <Link href={href(stats.fastest.book)} className={`${styles.statCaption} block truncate`}>
            {stats.fastest.book.title}　·　{stats.fastest.days} 天
          </Link>
        </div>
      )}

      {stats.count === 0 && <p className={`${styles.statCaption} pt-1`}>{year} 年還沒有讀完的書</p>}
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
    <div className="pb-8">
      <div className={styles.railHead}>
        <span className={styles.labelInk}>{label}</span>
        <span className={styles.meta}>{count} 本</span>
      </div>
      {books.map((book) => (
        <div key={book.id} className={styles.railItem}>
          <Link href={href(book)} className={styles.railTitle}>
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
  const reading = books.filter((b) => b.status === "閱讀中");
  const want = books.filter((b) => b.status === "想讀");
  const done = books.filter((b) => b.status === "已讀完");
  const headline = pickHeadline(reading);
  const rest = reading.filter((b) => b.id !== headline?.id);
  const headlineNotes = headline
    ? notesForSource(writings, [headline.originId || headline.id])
    : [];
  const yearStats = getYearStats(books);

  return (
    <div className={styles.frame}>
      <div className={styles.main}>
        {headline && (
          <Headline
            book={headline}
            href={href(headline)}
            latestNote={headlineNotes[0]}
            quoteCount={quotes.filter((q) => q.bookId === headline.id).length}
            vocabularyCount={vocabulary.filter((v) => v.bookId === headline.id).length}
            noteCount={headlineNotes.length}
          />
        )}

        <div>
          {byMonth(done).map((group) => (
            <div key={group.label}>
              <div className={`${styles.month} flex items-baseline justify-between`}>
                <span className={styles.monthLabel}>{group.label}</span>
                <span className={styles.meta}>{group.books.length} 本</span>
              </div>
              <div className={styles.monthGrid}>
                {group.books.map((book) => {
                  const note = notesForSource(writings, [book.originId || book.id])[0];
                  return (
                    <div key={book.id} className={styles.item}>
                      <div className="flex items-baseline justify-between pb-2">
                        <span className={styles.meta}>{book.endDate}</span>
                        {book.domain && <span className={styles.label}>{book.domain}</span>}
                      </div>
                      <CoverBand coverUrl={book.coverUrl} seed={book.id} label={book.title} />
                      <Link href={href(book)} className={`${styles.itemTitle} mt-3 block truncate`}>
                        {book.title}
                      </Link>
                      {note && <p className={`${styles.byline} line-clamp-2 pt-1`}>{note.note}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.rail}>
        <StatsRail stats={yearStats} href={href} />
        <Rail label="其餘在讀" count={rest.length} books={rest} href={href} />
        <Rail
          label="想讀"
          count={want.length}
          books={want.slice(0, 5)}
          href={href}
          more={want.length > 5 ? `看全部 ${want.length} 本 →` : undefined}
        />
      </div>
    </div>
  );
}
