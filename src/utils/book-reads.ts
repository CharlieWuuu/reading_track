import { Book } from "@/types/book";

/**
 * 同一本書的所有列。
 *
 * 每讀一次就是新的一列，重讀那幾列的 `originId` 指回第一次那一列。
 * 這支把「某一次讀」還原成「那本書」，佳句與單字才聚得起來。
 */

/** 這一列屬於哪一本書：自己是第一次讀就是自己的編號 */
export function rootId(book: Book): string {
  return book.originId || book.id;
}

/** 跟這一列同一本書的所有列，含它自己。沒有重讀就只有一列 */
export function sameBook(books: Book[], book: Book): Book[] {
  const root = rootId(book);
  return books.filter((b) => rootId(b) === root);
}

/** 一本書讀過幾次：只算讀完的，想讀與閱讀中那一次還沒完成 */
export function readCount(books: Book[], book: Book): number {
  return sameBook(books, book).filter((b) => b.status === "已讀完").length;
}
