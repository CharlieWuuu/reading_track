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

export type KeywordMentions = {
  books: { id: string; title: string; coverUrl: string }[];
  articles: { id: string; title: string }[];
  journal: { id: string; title: string }[];
};

/**
 * 提到這個關鍵字的所有紀錄。
 *
 * 關鍵字是唯一一個橫跨三張表的東西——同一個字可能出現在某本書、某篇文章、
 * 某一則書寫上，快看視窗要一次講完，不然「這個字我在哪看過」還是得自己找。
 */
export function getKeywordMentions(
  name: string,
  books: Book[],
  articles: { id: string; title: string; keywords: string }[],
  journal: { id: string; title: string; keywords: string }[],
): KeywordMentions {
  const has = (keywords: string) => splitLines(keywords).includes(name);
  return {
    books: books
      .filter((b) => has(b.keywords))
      .map((b) => ({ id: b.id, title: b.title, coverUrl: b.coverUrl })),
    articles: articles.filter((a) => has(a.keywords)).map((a) => ({ id: a.id, title: a.title })),
    journal: journal.filter((e) => has(e.keywords)).map((e) => ({ id: e.id, title: e.title })),
  };
}
