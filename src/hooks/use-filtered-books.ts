"use client";

import { useBooks } from "@/hooks/use-books";
import { useUrlParams } from "@/hooks/use-url-param";
import { Book, splitLines } from "@/types/book";
import {
  effectiveStatus,
  matchesStatus,
  parseStatusFilter,
  StatusFilter,
  statusHeading,
} from "@/utils/book-filter";
import { matchesSearch, searchTerms } from "@/utils/search";

export type FilteredBooks = {
  allBooks: Book[];
  isLoading: boolean;
  error: string | undefined;
  /** 搜尋與關鍵字反查套過，狀態還沒套——概覽頁要的就是這份 */
  found: Book[];
  /** found 再套狀態篩選——表格／卡片頁用這份 */
  books: Book[];
  status: StatusFilter;
  keyword: string;
  terms: string[];
  heading: string;
};

/**
 * 書單的篩選鏈：關鍵字反查、搜尋、狀態，三頁（概覽／表格／卡片）與麵包屑的
 * 統計數字共用同一份，才不會三個地方各自兜一次、篩選邏輯慢慢兜出差異。
 */
export function useFilteredBooks(): FilteredBooks {
  const { books: allBooks, isLoading, error } = useBooks();
  const { searchParams } = useUrlParams();
  // 反查：帶著 ?keyword= 就只看提到這個關鍵字的書
  const keyword = searchParams.get("keyword") ?? "";
  // 搜尋框在頁首，這裡跟著網址走：關鍵字反查與搜尋兩個條件同時成立
  const terms = searchTerms(searchParams.get("q") ?? "");
  // 找東西的時候不篩狀態：搜書名找不到會讓人以為那本書不見了
  const status = effectiveStatus(
    parseStatusFilter(searchParams.get("status")),
    terms.length > 0 || Boolean(keyword),
  );
  const found = allBooks.filter(
    (b) =>
      (!keyword || splitLines(b.keywords).includes(keyword)) &&
      matchesSearch(terms, b.title, b.author, b.publisher, b.keywords, b.note),
  );
  const books = found.filter((b) => matchesStatus(b, status));
  const heading =
    terms.length > 0 ? "搜尋結果" : keyword ? `提到「${keyword}」` : statusHeading(status);

  return { allBooks, isLoading, error, found, books, status, keyword, terms, heading };
}
