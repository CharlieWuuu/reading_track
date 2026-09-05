import { and, eq, inArray, sql } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/privacy";
import { db, type Tx } from "@/lib/db/client";
import { bookKeywords } from "@/lib/db/schema/keyword-links";
import { books, readings } from "@/lib/db/schema/reading";
import { keywords } from "@/lib/db/schema/taxonomy";
import { Book, splitLines } from "@/types/book";
import { attributeIdFor, typeIdFor } from "./taxonomy";
import { toDate, toInt } from "./values";

/**
 * 舊的 Book 形狀寫回拆開的資料表。
 *
 * 一筆 Book 等於「一次閱讀」：書名作者進 books，日期平台進 readings。
 * originId 有值代表這是同一本書的另一次讀，掛到它指的那本書底下，不另開一本。
 */

/** 關鍵字主檔沒有的字先補一列，關聯表才插得進去 */
async function ensureKeywords(tx: Tx, userId: string, names: string[]): Promise<void> {
  if (!names.length) return;
  await tx
    .insert(keywords)
    .values(names.map((name) => ({ userId, name })))
    .onConflictDoNothing();
}

async function setBookKeywords(
  tx: Tx,
  userId: string,
  bookId: string,
  names: string[],
): Promise<void> {
  await ensureKeywords(tx, userId, names);
  await tx
    .delete(bookKeywords)
    .where(and(eq(bookKeywords.userId, userId), eq(bookKeywords.bookId, bookId)));
  if (names.length) {
    await tx.insert(bookKeywords).values(names.map((keyword) => ({ userId, bookId, keyword })));
  }
}

function readingValues(book: Book) {
  return {
    status: book.status,
    startDate: toDate(book.startDate),
    endDate: toDate(book.endDate),
    isbn: book.isbn,
    platform: book.platform,
    publisher: book.publisher,
    sourceUrl: book.sourceUrl,
    coverUrl: book.coverUrl,
    pageCount: toInt(book.pageCount),
    wordCount: toInt(book.wordCount),
    isPrivate: book.private === PRIVATE_MARK,
  };
}

export async function addBookRow(userId: string, book: Book): Promise<void> {
  const names = splitLines(book.keywords);

  await db.transaction(async (tx) => {
    // 重讀：originId 指的是「第一次讀」那一列，找出它屬於哪本書
    const origin = book.originId.trim();
    const existing = origin
      ? await tx
          .select({ bookId: readings.bookId })
          .from(readings)
          .where(and(eq(readings.userId, userId), eq(readings.id, origin)))
      : [];

    const bookId =
      existing[0]?.bookId ??
      (
        await tx
          .insert(books)
          .values({
            userId,
            title: book.title,
            author: book.author,
            language: book.language,
            typeId: await typeIdFor(tx, userId, book.domain, book.subDomain),
            attributeId: await attributeIdFor(tx, userId, book.type),
          })
          .returning({ id: books.id })
      )[0].id;

    await tx.insert(readings).values({ id: book.id, userId, bookId, ...readingValues(book) });
    await setBookKeywords(tx, userId, bookId, names);
  });
}

/**
 * 一次閱讀的更新。書名、作者、領域這些屬於「書」，改了會影響同一本的其他次閱讀——
 * 那正是拆表想要的效果：改一次書名，重讀那幾列一起改。
 */
export async function updateBookRow(
  userId: string,
  id: string,
  patch: Partial<Book>,
): Promise<void> {
  const [target] = await db
    .select({ bookId: readings.bookId })
    .from(readings)
    .where(and(eq(readings.userId, userId), eq(readings.id, id)));
  if (!target) throw new Error("找不到這一筆");

  const bookPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) bookPatch.title = patch.title;
  if (patch.author !== undefined) bookPatch.author = patch.author;
  if (patch.language !== undefined) bookPatch.language = patch.language;

  const readingPatch: Record<string, unknown> = {};
  const fields = [
    "status",
    "startDate",
    "endDate",
    "isbn",
    "platform",
    "publisher",
    "sourceUrl",
    "coverUrl",
  ] as const;
  for (const field of fields) if (patch[field] !== undefined) readingPatch[field] = patch[field];
  if (patch.startDate !== undefined) readingPatch.startDate = toDate(patch.startDate);
  if (patch.endDate !== undefined) readingPatch.endDate = toDate(patch.endDate);
  if (patch.pageCount !== undefined) readingPatch.pageCount = toInt(patch.pageCount);
  if (patch.wordCount !== undefined) readingPatch.wordCount = toInt(patch.wordCount);
  if (patch.private !== undefined) readingPatch.isPrivate = patch.private === PRIVATE_MARK;

  await db.transaction(async (tx) => {
    // 分類是 upsert，也就是寫入；跟主體同一個交易才會一起回滾
    if (patch.domain !== undefined || patch.subDomain !== undefined) {
      bookPatch.typeId = await typeIdFor(tx, userId, patch.domain ?? "", patch.subDomain ?? "");
    }
    if (patch.type !== undefined)
      bookPatch.attributeId = await attributeIdFor(tx, userId, patch.type);

    if (Object.keys(bookPatch).length)
      await tx.update(books).set(bookPatch).where(eq(books.id, target.bookId));
    if (Object.keys(readingPatch).length)
      await tx.update(readings).set(readingPatch).where(eq(readings.id, id));
    if (patch.keywords !== undefined)
      await setBookKeywords(tx, userId, target.bookId, splitLines(patch.keywords));
  });
}

/** 刪掉最後一次閱讀時，那本書也沒有存在的意義了 */
export async function deleteBookRow(userId: string, id: string): Promise<void> {
  const [target] = await db
    .select({ bookId: readings.bookId })
    .from(readings)
    .where(and(eq(readings.userId, userId), eq(readings.id, id)));
  if (!target) return;

  await db.transaction(async (tx) => {
    await tx.delete(readings).where(and(eq(readings.userId, userId), eq(readings.id, id)));
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(readings)
      .where(eq(readings.bookId, target.bookId));
    if (count === 0) await tx.delete(books).where(eq(books.id, target.bookId));
  });
}

/** 關鍵字改名或合併時，把掛在舊名字上的書換過去 */
export async function renameBookKeyword(userId: string, from: string, to: string): Promise<void> {
  const rows = await db
    .select({ bookId: bookKeywords.bookId })
    .from(bookKeywords)
    .where(and(eq(bookKeywords.userId, userId), eq(bookKeywords.keyword, from)));
  if (!rows.length) return;

  await db.transaction(async (tx) => {
    await ensureKeywords(tx, userId, [to]);
    await tx
      .delete(bookKeywords)
      .where(and(eq(bookKeywords.userId, userId), eq(bookKeywords.keyword, from)));
    // 合併到已經存在的名字時，那本書可能兩個都掛著，onConflictDoNothing 擋掉重複
    await tx
      .insert(bookKeywords)
      .values(rows.map((r) => ({ userId, bookId: r.bookId, keyword: to })))
      .onConflictDoNothing();
  });
}

export async function deleteBooksByIds(userId: string, ids: string[]): Promise<void> {
  if (ids.length)
    await db.delete(readings).where(and(eq(readings.userId, userId), inArray(readings.id, ids)));
}

/**
 * 把一次閱讀掛到另一本書底下（「這是重讀」）。
 *
 * Sheet 時代這只是填一個 originId 欄位；拆表之後它是真的搬家：換掉 book_id，
 * 原本那本書如果沒有其他次閱讀就一起刪掉，不留空殼。
 */
export async function linkReread(
  userId: string,
  readingId: string,
  originReadingId: string,
): Promise<boolean> {
  if (readingId === originReadingId) return false;

  const [target] = await db
    .select({ bookId: readings.bookId })
    .from(readings)
    .where(and(eq(readings.userId, userId), eq(readings.id, readingId)));
  const [origin] = await db
    .select({ bookId: readings.bookId })
    .from(readings)
    .where(and(eq(readings.userId, userId), eq(readings.id, originReadingId)));
  if (!target || !origin || target.bookId === origin.bookId) return false;

  await db.transaction(async (tx) => {
    await tx.update(readings).set({ bookId: origin.bookId }).where(eq(readings.id, readingId));
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(readings)
      .where(eq(readings.bookId, target.bookId));
    if (count === 0) await tx.delete(books).where(eq(books.id, target.bookId));
  });
  return true;
}

/** 補齊資料那條路會一次改很多列；逐列更新就好，量級是幾十筆不是幾萬筆 */
export async function bulkUpdateBooks(
  userId: string,
  patches: Map<string, Partial<Book>>,
): Promise<number> {
  let written = 0;
  for (const [id, patch] of patches) {
    const { originId, ...rest } = patch;
    if (originId !== undefined && originId) await linkReread(userId, id, originId);
    if (Object.keys(rest).length) await updateBookRow(userId, id, rest);
    written++;
  }
  return written;
}
