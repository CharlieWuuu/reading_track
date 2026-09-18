"use client";

import { useBooks } from "@/hooks/use-books";
import { useUrlParams } from "@/hooks/use-url-param";
import { Book, splitLines } from "@/types/book";

export type FilteredBooks = {
  allBooks: Book[];
  isLoading: boolean;
  error: string | undefined;
  /** 關鍵字反查套過的那一份 */
  found: Book[];
  /** 同 found——狀態篩選拿掉後兩者一樣，呼叫端還分著用，先留著名字 */
  books: Book[];
  keyword: string;
  heading: string;
};

/**
 * 書單的篩選：只剩關鍵字反查。三頁（概覽／表格／卡片）與麵包屑的統計數字
 * 共用同一份，才不會三個地方各自兜一次。
 */
export function useFilteredBooks(): FilteredBooks {
  const { books: allBooks, isLoading, error } = useBooks();
  const { searchParams } = useUrlParams();
  // 反查：帶著 ?keyword= 就只看提到這個關鍵字的書
  const keyword = searchParams.get("keyword") ?? "";
  const found = allBooks.filter((b) => !keyword || splitLines(b.keywords).includes(keyword));
  const heading = keyword ? `提到「${keyword}」` : "全部書籍";

  return { allBooks, isLoading, error, found, books: found, keyword, heading };
}
