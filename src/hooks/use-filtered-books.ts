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

export type FilteredBooks = {
  allBooks: Book[];
  isLoading: boolean;
  error: string | undefined;
  /** 關鍵字反查套過，狀態還沒套——概覽頁要的就是這份 */
  found: Book[];
  /** found 再套狀態篩選——表格／卡片頁用這份 */
  books: Book[];
  status: StatusFilter;
  keyword: string;
  heading: string;
};

/**
 * 書單的篩選鏈：關鍵字反查、狀態，三頁（概覽／表格／卡片）與麵包屑的
 * 統計數字共用同一份，才不會三個地方各自兜一次、篩選邏輯慢慢兜出差異。
 */
export function useFilteredBooks(): FilteredBooks {
  const { books: allBooks, isLoading, error } = useBooks();
  const { searchParams } = useUrlParams();
  // 反查：帶著 ?keyword= 就只看提到這個關鍵字的書
  const keyword = searchParams.get("keyword") ?? "";
  // 反查的時候不篩狀態：找提到某個字的書，篩掉一半會讓人以為那本書不見了
  const status = effectiveStatus(parseStatusFilter(searchParams.get("status")), Boolean(keyword));
  const found = allBooks.filter((b) => !keyword || splitLines(b.keywords).includes(keyword));
  const books = found.filter((b) => matchesStatus(b, status));
  const heading = keyword ? `提到「${keyword}」` : statusHeading(status);

  return { allBooks, isLoading, error, found, books, status, keyword, heading };
}
