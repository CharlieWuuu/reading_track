import { Book, splitLines } from "@/types/book";

export type KeywordEntry = {
  name: string;
  /** 提到這個關鍵字的書，依完成日期新到舊 */
  books: Book[];
};

/** 維基主檔還沒做，現在的關鍵字資料就只有「哪些書提到它」，其餘欄位之後才補得出來 */
export function getKeywordEntries(books: Book[]): KeywordEntry[] {
  const map = new Map<string, Book[]>();
  for (const book of books) {
    for (const name of splitLines(book.keywords)) {
      const list = map.get(name);
      if (list) list.push(book);
      else map.set(name, [book]);
    }
  }

  return [...map.entries()]
    .map(([name, list]) => ({ name, books: list }))
    .sort((a, b) => b.books.length - a.books.length || a.name.localeCompare(b.name, "zh-Hant"));
}
