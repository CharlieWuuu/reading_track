import { asc, eq, isNull } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/privacy";
import { db } from "@/lib/db/client";
import { bookKeywords } from "@/lib/db/schema/keyword-links";
import { books, readings } from "@/lib/db/schema/reading";
import { attributes } from "@/lib/db/schema/taxonomy";
import { Book, inferStatus, normalizeStatus } from "@/types/book";
import { typePaths } from "./taxonomy";

/**
 * 資料表讀回舊的 Book 形狀。
 *
 * 舊形狀一列等於「一次閱讀」，所以這裡以 readings 為主，join 回書的欄位。
 * 拆表帶來的好處（重讀聚回同一本）要等 UI 改形狀才顯現，這一層先維持原樣，
 * 讓切換資料來源這件事不牽動任何畫面。
 */

async function keywordsByBook(): Promise<Map<string, string[]>> {
  const rows = await db
    .select({ bookId: bookKeywords.bookId, keyword: bookKeywords.keyword })
    .from(bookKeywords)
    .orderBy(asc(bookKeywords.keyword));

  const map = new Map<string, string[]>();
  for (const row of rows) map.set(row.bookId, [...(map.get(row.bookId) ?? []), row.keyword]);
  return map;
}

export async function listBooks(): Promise<Book[]> {
  const [types, keywords, rows] = await Promise.all([
    typePaths(),
    keywordsByBook(),
    db
      .select({
        reading: readings,
        book: books,
        attribute: attributes.name,
      })
      .from(readings)
      .innerJoin(books, eq(books.id, readings.bookId))
      .leftJoin(attributes, eq(attributes.id, books.attributeId))
      .orderBy(asc(readings.createdAt)),
  ]);

  /** 同一本書的第一次閱讀。舊形狀的 originId 指的就是它 */
  const firstReadingOf = new Map<string, string>();
  for (const { reading, book } of rows) {
    if (!firstReadingOf.has(book.id)) firstReadingOf.set(book.id, reading.id);
  }

  return rows.map(({ reading, book, attribute }) => {
    const type = book.typeId ? types.get(book.typeId) : undefined;
    const first = firstReadingOf.get(book.id);
    return {
      id: reading.id,
      title: book.title,
      author: book.author,
      coverUrl: reading.coverUrl,
      publisher: reading.publisher,
      isbn: reading.isbn,
      platform: reading.platform,
      sourceUrl: reading.sourceUrl,
      status: normalizeStatus(reading.status) ?? inferStatus(reading.startDate, reading.endDate),
      startDate: reading.startDate,
      endDate: reading.endDate,
      domain: type?.domain ?? "",
      subDomain: type?.subDomain ?? "",
      type: attribute ?? "",
      language: book.language,
      pageCount: reading.pageCount?.toString() ?? "",
      wordCount: reading.wordCount?.toString() ?? "",
      note: "", // 心得早就搬去書寫了，這欄留著只為了型別相容
      quotes: "",
      vocabulary: "",
      keywords: (keywords.get(book.id) ?? []).join("\n"),
      private: reading.isPrivate ? PRIVATE_MARK : "",
      relatedArticles: "",
      // 第一次讀的那列 originId 是空的，其餘指回它——跟 Sheet 時代的約定一樣
      originId: first === reading.id ? "" : (first ?? ""),
    };
  });
}

/** 舊介面回報補了幾個編號；資料庫不需要補，永遠是 0 */
export async function listBooksWithMeta(): Promise<{ books: Book[]; idsBackfilled: number }> {
  return { books: await listBooks(), idsBackfilled: 0 };
}

/** 佳句、單字、心得記的是「書」，但畫面上的編號是「某一次讀」，兩邊要對得起來 */
export async function bookIdByReadingId(): Promise<Map<string, string>> {
  const rows = await db.select({ id: readings.id, bookId: readings.bookId }).from(readings);
  return new Map(rows.map((r) => [r.id, r.bookId]));
}

/** 反過來：一本書對應到它第一次讀的那個編號 */
export async function firstReadingIdByBookId(): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: readings.id, bookId: readings.bookId })
    .from(readings)
    .orderBy(asc(readings.createdAt));

  const map = new Map<string, string>();
  for (const row of rows) if (!map.has(row.bookId)) map.set(row.bookId, row.id);
  return map;
}

/** 沒有任何一次閱讀的書不該存在；留著這支給匯入後的健檢用 */
export async function orphanBooks() {
  return db
    .select({ id: books.id, title: books.title })
    .from(books)
    .leftJoin(readings, eq(readings.bookId, books.id))
    .where(isNull(readings.id));
}
