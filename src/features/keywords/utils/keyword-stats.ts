import { Book, splitLines } from "@/types/book";

export type KeywordEntry = {
  name: string;
  /** 提到這個關鍵字的書，依完成日期新到舊 */
  books: Book[];
};

/**
 * 有哪些關鍵字以主檔為準，書籍只是「誰提到它」。
 *
 * 本來反過來：從每本書的 keywords 欄反推有哪些關鍵字，所以自己記一筆
 * （沒有任何書提到的）就不會出現。關鍵字是獨立的一種片段，不是書的附屬品。
 *
 * `names` 是主檔那份；沒給就退回舊行為，統計那幾張圖還在用書籍那條路。
 */
export function getKeywordEntries(books: Book[], names?: readonly string[]): KeywordEntry[] {
  const map = new Map<string, Book[]>(names?.map((name) => [name, []]));
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
  writings: { id: string; title: string }[];
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
  writings: { id: string; title: string; keywords: string }[],
): KeywordMentions {
  const has = (keywords: string) => splitLines(keywords).includes(name);
  return {
    books: books
      .filter((b) => has(b.keywords))
      .map((b) => ({ id: b.id, title: b.title, coverUrl: b.coverUrl })),
    articles: articles.filter((a) => has(a.keywords)).map((a) => ({ id: a.id, title: a.title })),
    writings: writings.filter((e) => has(e.keywords)).map((e) => ({ id: e.id, title: e.title })),
  };
}
