import { and, eq, inArray, sql } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/privacy";
import { db, type Tx } from "@/lib/db/client";
import { mapBookKeyword } from "@/lib/db/schema/keyword-links";
import { keywords } from "@/lib/db/schema/taxonomy";
import { records, works } from "@/lib/db/schema/works";
import { Book, splitLines } from "@/types/book";
import { setRecordSourceUrl } from "./external-links";
import { kindIdByName, statusIdByLabel } from "./kind-lookup";
import { attributeIdFor, typeIdFor } from "./taxonomy";
import { toDate, toInt } from "./values";

/**
 * 舊的 Book 形狀寫回 works／records。
 *
 * 一筆 Book 等於「一次閱讀」：書名作者進 works，日期平台進 records。
 * originId 有值代表這是同一本書的另一次讀，掛到它指的那個作品底下，不另開一本。
 *
 * 出版社與平台在新表合成一欄 source，字數沒有對應欄位——舊形狀那兩欄留著只為了
 * 型別相容，寫入時丟掉。
 */

const BOOK_KIND = "書籍";

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
    .delete(mapBookKeyword)
    .where(and(eq(mapBookKeyword.userId, userId), eq(mapBookKeyword.bookId, bookId)));
  if (names.length) {
    await tx.insert(mapBookKeyword).values(names.map((keyword) => ({ userId, bookId, keyword })));
  }
}

async function recordValues(tx: Tx, userId: string, book: Book) {
  const kindId = await kindIdByName(tx, userId, BOOK_KIND);
  return {
    statusId: await statusIdByLabel(tx, kindId, book.status),
    startDate: toDate(book.startDate),
    endDate: toDate(book.endDate),
    amount: toInt(book.pageCount),
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
          .select({ workId: records.workId })
          .from(records)
          .where(and(eq(records.userId, userId), eq(records.id, origin)))
      : [];

    const workId =
      existing[0]?.workId ??
      (
        await tx
          .insert(works)
          .values({
            userId,
            kindId: await kindIdByName(tx, userId, BOOK_KIND),
            title: book.title,
            creator: book.author,
            language: book.language,
            source: book.publisher || book.platform,
            externalId: book.isbn,
            coverUrl: book.coverUrl,
            topicId: await typeIdFor(tx, userId, book.domain, book.subDomain),
            attributeId: await attributeIdFor(tx, userId, book.type),
          })
          .returning({ id: works.id })
      )[0].id;

    const [record] = await tx
      .insert(records)
      .values({ id: book.id, userId, workId, ...(await recordValues(tx, userId, book)) })
      .returning({ id: records.id });
    await setRecordSourceUrl(tx, userId, record.id, book.sourceUrl);
    await setBookKeywords(tx, userId, workId, names);
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
    .select({ workId: records.workId })
    .from(records)
    .where(and(eq(records.userId, userId), eq(records.id, id)));
  if (!target) throw new Error("找不到這一筆");

  const workPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) workPatch.title = patch.title;
  if (patch.author !== undefined) workPatch.creator = patch.author;
  if (patch.language !== undefined) workPatch.language = patch.language;
  if (patch.isbn !== undefined) workPatch.externalId = patch.isbn;
  if (patch.coverUrl !== undefined) workPatch.coverUrl = patch.coverUrl;
  // 出版社與平台合成一欄，兩個都給就以出版社為準
  if (patch.publisher !== undefined) workPatch.source = patch.publisher;
  else if (patch.platform !== undefined) workPatch.source = patch.platform;

  const recordPatch: Record<string, unknown> = {};
  if (patch.startDate !== undefined) recordPatch.startDate = toDate(patch.startDate);
  if (patch.endDate !== undefined) recordPatch.endDate = toDate(patch.endDate);
  if (patch.pageCount !== undefined) recordPatch.amount = toInt(patch.pageCount);
  if (patch.private !== undefined) recordPatch.isPrivate = patch.private === PRIVATE_MARK;

  await db.transaction(async (tx) => {
    // 分類是 upsert，也就是寫入；跟主體同一個交易才會一起回滾
    if (patch.domain !== undefined || patch.subDomain !== undefined) {
      workPatch.topicId = await typeIdFor(tx, userId, patch.domain ?? "", patch.subDomain ?? "");
    }
    if (patch.type !== undefined)
      workPatch.attributeId = await attributeIdFor(tx, userId, patch.type);
    if (patch.status !== undefined) {
      const kindId = await kindIdByName(tx, userId, BOOK_KIND);
      recordPatch.statusId = await statusIdByLabel(tx, kindId, patch.status);
    }

    if (Object.keys(workPatch).length)
      await tx.update(works).set(workPatch).where(eq(works.id, target.workId));
    if (Object.keys(recordPatch).length)
      await tx.update(records).set(recordPatch).where(eq(records.id, id));
    if (patch.sourceUrl !== undefined) await setRecordSourceUrl(tx, userId, id, patch.sourceUrl);
    if (patch.keywords !== undefined)
      await setBookKeywords(tx, userId, target.workId, splitLines(patch.keywords));
  });
}

/** 刪掉最後一次閱讀時，那個作品也沒有存在的意義了 */
export async function deleteBookRow(userId: string, id: string): Promise<void> {
  const [target] = await db
    .select({ workId: records.workId })
    .from(records)
    .where(and(eq(records.userId, userId), eq(records.id, id)));
  if (!target) return;

  await db.transaction(async (tx) => {
    await tx.delete(records).where(and(eq(records.userId, userId), eq(records.id, id)));
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(records)
      .where(eq(records.workId, target.workId));
    if (count === 0) await tx.delete(works).where(eq(works.id, target.workId));
  });
}

/** 關鍵字改名或合併時，把掛在舊名字上的書換過去 */
export async function renameBookKeyword(userId: string, from: string, to: string): Promise<void> {
  const rows = await db
    .select({ bookId: mapBookKeyword.bookId })
    .from(mapBookKeyword)
    .where(and(eq(mapBookKeyword.userId, userId), eq(mapBookKeyword.keyword, from)));
  if (!rows.length) return;

  await db.transaction(async (tx) => {
    await ensureKeywords(tx, userId, [to]);
    await tx
      .delete(mapBookKeyword)
      .where(and(eq(mapBookKeyword.userId, userId), eq(mapBookKeyword.keyword, from)));
    // 合併到已經存在的名字時，那本書可能兩個都掛著，onConflictDoNothing 擋掉重複
    await tx
      .insert(mapBookKeyword)
      .values(rows.map((r) => ({ userId, bookId: r.bookId, keyword: to })))
      .onConflictDoNothing();
  });
}

export async function deleteBooksByIds(userId: string, ids: string[]): Promise<void> {
  if (ids.length)
    await db.delete(records).where(and(eq(records.userId, userId), inArray(records.id, ids)));
}

/**
 * 把一次閱讀掛到另一個作品底下（「這是重讀」）。
 *
 * Sheet 時代這只是填一個 originId 欄位；拆表之後它是真的搬家：換掉 work_id，
 * 原本那個作品如果沒有其他次紀錄就一起刪掉，不留空殼。
 */
export async function linkReread(
  userId: string,
  readingId: string,
  originReadingId: string,
): Promise<boolean> {
  if (readingId === originReadingId) return false;

  const [target] = await db
    .select({ workId: records.workId })
    .from(records)
    .where(and(eq(records.userId, userId), eq(records.id, readingId)));
  const [origin] = await db
    .select({ workId: records.workId })
    .from(records)
    .where(and(eq(records.userId, userId), eq(records.id, originReadingId)));
  if (!target || !origin || target.workId === origin.workId) return false;

  await db.transaction(async (tx) => {
    await tx.update(records).set({ workId: origin.workId }).where(eq(records.id, readingId));
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(records)
      .where(eq(records.workId, target.workId));
    if (count === 0) await tx.delete(works).where(eq(works.id, target.workId));
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
