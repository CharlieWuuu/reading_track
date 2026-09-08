import { and, asc, eq, isNull } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/privacy";
import { db } from "@/lib/db/client";
import { bookKeywords } from "@/lib/db/schema/keyword-links";
import { recordKinds, recordKindStatuses } from "@/lib/db/schema/kinds";
import { attributes } from "@/lib/db/schema/taxonomy";
import { records, works } from "@/lib/db/schema/works";
import { Book, inferStatus, normalizeStatus } from "@/types/book";
import { typePaths } from "./taxonomy";

/**
 * works／records 讀回舊的 Book 形狀。
 *
 * 一列等於「一次閱讀」，所以以 records 為主、join 回作品的欄位。畫面還在用舊形狀，
 * 換資料來源這件事不牽動任何頁面——等畫面改完再把這一層拆掉。
 *
 * 編號沿用搬遷前的：record.id 就是舊的 reading.id，work.id 就是舊的 book.id，
 * 所以關聯表（book_keywords）與舊網址都還對得上。
 */

const BOOK_KIND = "書籍";

async function keywordsByWork(userId: string): Promise<Map<string, string[]>> {
  const rows = await db
    .select({ bookId: bookKeywords.bookId, keyword: bookKeywords.keyword })
    .from(bookKeywords)
    .where(eq(bookKeywords.userId, userId))
    .orderBy(asc(bookKeywords.keyword));

  const map = new Map<string, string[]>();
  for (const row of rows) map.set(row.bookId, [...(map.get(row.bookId) ?? []), row.keyword]);
  return map;
}

export async function listBooks(userId: string): Promise<Book[]> {
  const [types, keywords, rows] = await Promise.all([
    typePaths(userId),
    keywordsByWork(userId),
    db
      .select({
        record: records,
        work: works,
        status: recordKindStatuses.label,
        attribute: attributes.name,
      })
      .from(records)
      .innerJoin(works, eq(works.id, records.workId))
      .innerJoin(recordKinds, eq(recordKinds.id, works.kindId))
      .innerJoin(recordKindStatuses, eq(recordKindStatuses.id, records.statusId))
      .leftJoin(attributes, eq(attributes.id, works.attributeId))
      .where(and(eq(records.userId, userId), eq(recordKinds.name, BOOK_KIND)))
      .orderBy(asc(records.createdAt)),
  ]);

  /** 同一本書的第一次閱讀。舊形狀的 originId 指的就是它 */
  const firstRecordOf = new Map<string, string>();
  for (const { record, work } of rows) {
    if (!firstRecordOf.has(work.id)) firstRecordOf.set(work.id, record.id);
  }

  return rows.map(({ record, work, status, attribute }) => {
    const type = work.topicId ? types.get(work.topicId) : undefined;
    const first = firstRecordOf.get(work.id);
    return {
      id: record.id,
      createdAt: record.createdAt.toISOString(),
      title: work.title,
      author: work.creator,
      coverUrl: record.coverUrl,
      publisher: record.source,
      isbn: record.externalId,
      platform: "", // 出版社與平台合成一欄了，舊形狀留著空的
      sourceUrl: record.sourceUrl,
      status: normalizeStatus(status) ?? inferStatus(record.startDate, record.endDate),
      startDate: record.startDate,
      endDate: record.endDate,
      domain: type?.domain ?? "",
      subDomain: type?.subDomain ?? "",
      type: attribute ?? "",
      language: work.language,
      pageCount: record.amount?.toString() ?? "",
      wordCount: "",
      note: "", // 心得早就搬去書寫了，這欄留著只為了型別相容
      quotes: "",
      vocabulary: "",
      keywords: (keywords.get(work.id) ?? []).join("\n"),
      private: record.isPrivate ? PRIVATE_MARK : "",
      relatedArticles: "",
      // 第一次讀的那列 originId 是空的，其餘指回它——跟 Sheet 時代的約定一樣
      originId: first === record.id ? "" : (first ?? ""),
    };
  });
}

/** 舊介面回報補了幾個編號；資料庫不需要補，永遠是 0 */
export async function listBooksWithMeta(
  userId: string,
): Promise<{ books: Book[]; idsBackfilled: number }> {
  return { books: await listBooks(userId), idsBackfilled: 0 };
}

/** 佳句、單字、心得記的是「作品」，但畫面上的編號是「某一次讀」，兩邊要對得起來 */
export async function bookIdByReadingId(userId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: records.id, workId: records.workId })
    .from(records)
    .where(eq(records.userId, userId));
  return new Map(rows.map((r) => [r.id, r.workId]));
}

/** 反過來：一個作品對應到它第一次被記錄的那個編號 */
export async function firstReadingIdByBookId(userId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: records.id, workId: records.workId })
    .from(records)
    .where(eq(records.userId, userId))
    .orderBy(asc(records.createdAt));

  const map = new Map<string, string>();
  for (const row of rows) if (!map.has(row.workId)) map.set(row.workId, row.id);
  return map;
}

/** 沒有任何一次紀錄的作品不該存在；留著這支給搬遷後的健檢用 */
export async function orphanBooks(userId: string) {
  return db
    .select({ id: works.id, title: works.title })
    .from(works)
    .leftJoin(records, eq(records.workId, works.id))
    .where(and(eq(works.userId, userId), isNull(records.id)));
}
