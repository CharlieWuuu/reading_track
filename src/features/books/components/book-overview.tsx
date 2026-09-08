"use client";

import Link from "next/link";
import { BookCover } from "@/components/ui/book-cover";
import { Book } from "@/types/book";
import { byMonth, pickHeadline } from "@/utils/book-overview";

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
  label: "text-label text-ink-faint tracking-label",
  labelInk: "text-label text-ink tracking-label",
  meta: "text-meta text-ink-faint tabular-nums",
  headline: "border-rule-strong flex gap-8 border-b-2 pb-5",
  headlineTitle: "font-serif text-lede leading-tight font-semibold tracking-tight",
  byline: "text-byline text-ink-muted",
  columns: "columns-1 gap-8 pt-1 md:columns-2 xl:columns-3 [&>*]:break-inside-avoid",
  month: "border-rule-strong break-after-avoid border-b-2 pt-4 pb-1.5",
  monthLabel: "font-serif text-item-sm font-semibold tracking-wide",
  item: "border-rule border-t py-3 first:border-t-0",
  itemTitle: "font-serif text-item leading-snug font-semibold tracking-tight",
  railItem: "border-rule border-b py-[7px]",
  railTitle: "font-serif text-item-sm leading-snug font-semibold",
};

function Headline({ book, href }: { book: Book; href: string }) {
  return (
    <div className={styles.headline}>
      <div className="w-[118px] shrink-0">
        <BookCover url={book.coverUrl} title={book.title} size="full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className={styles.label}>在讀 · 最近開始的一本</span>
        <Link href={href} className={styles.headlineTitle}>
          {book.title}
        </Link>
        <span className={styles.byline}>
          {[book.author, book.domain, book.pageCount && `${book.pageCount} 頁`]
            .filter(Boolean)
            .join("　·　")}
        </span>
        {book.startDate && <span className={styles.meta}>{book.startDate} 起讀</span>}
      </div>
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
        <span className={styles.meta}>{count}</span>
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

export function BookOverview({ books, href }: { books: Book[]; href: (book: Book) => string }) {
  const reading = books.filter((b) => b.status === "閱讀中");
  const want = books.filter((b) => b.status === "想讀");
  const done = books.filter((b) => b.status === "已讀完");
  const headline = pickHeadline(reading);
  const rest = reading.filter((b) => b.id !== headline?.id);

  return (
    <div className={styles.frame}>
      <div className={styles.main}>
        {headline && <Headline book={headline} href={href(headline)} />}

        <div className={styles.columns}>
          {byMonth(done).map((group) => (
            <div key={group.label}>
              <div className={styles.month}>
                <span className={styles.monthLabel}>{group.label}</span>
              </div>
              {group.books.map((book) => (
                <div key={book.id} className={styles.item}>
                  <div className="flex gap-3">
                    <div className="w-10 shrink-0">
                      <BookCover url={book.coverUrl} title={book.title} size="full" />
                    </div>
                    <div className="min-w-0">
                      <Link href={href(book)} className={styles.itemTitle}>
                        {book.title}
                      </Link>
                      <div className={`${styles.byline} pt-0.5`}>{book.author}</div>
                      <div className={`${styles.meta} pt-1.5`}>
                        {[book.endDate && `${book.endDate} 讀完`, book.domain]
                          .filter(Boolean)
                          .join("　·　")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.rail}>
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
