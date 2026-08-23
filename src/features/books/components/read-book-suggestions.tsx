"use client";

import { BookCover } from "@/components/ui/book-cover";
import { Book } from "@/types/book";

const styles = {
  panel:
    "absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-surface border bg-white py-1 shadow-lg",
  item: "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50",
  title: "min-w-0 flex-1 truncate",
  meta: "shrink-0 text-xs text-gray-400 tabular-nums",
};

/**
 * 打書名時從自己的書單裡找。
 *
 * 重讀一本書時，20 個欄位有 18 個跟上次一樣——與其重打或重查，不如直接帶上次那筆。
 * 只列讀過的：想讀與閱讀中那幾本還在書單上，再新增一次多半是手滑。
 */
export function ReadBookSuggestions({
  books,
  query,
  onPick,
}: {
  books: Book[];
  query: string;
  onPick: (book: Book) => void;
}) {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const matches = books
    .filter((b) => b.status === "已讀完" && b.title.toLowerCase().includes(q))
    .slice(0, 5);

  if (matches.length === 0) return null;

  return (
    <div className={styles.panel}>
      {matches.map((book) => (
        <button key={book.id} type="button" onClick={() => onPick(book)} className={styles.item}>
          <BookCover url={book.coverUrl} title={book.title} size="sm" />
          <span className={styles.title}>{book.title}</span>
          {/* 讀完日期是用來分辨同名多本的：同一本讀兩次，看日期就知道挑哪一筆 */}
          <span className={styles.meta}>{book.endDate ? `${book.endDate} 讀完` : "讀過"}</span>
        </button>
      ))}
    </div>
  );
}
