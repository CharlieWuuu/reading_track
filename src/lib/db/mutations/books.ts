import { and, eq, inArray, sql } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/privacy";
import { db } from "@/lib/db/client";
import { records, works } from "@/lib/db/schema/works";
import { Book, splitLines } from "@/types/book";
import { setRecordSourceUrl } from "./external-links";
import { setKeywordLinks } from "./fragments";
import { unlinkAll } from "./internal-links";
import { kindIdByName } from "./kind-lookup";
import { attributeIdFor, typeIdFor } from "./taxonomy";
import { toDate, toInt } from "./values";

/**
 * 舊的 Book 形狀寫回 works／records。
 *
 * 一筆 Book 等於「一次閱讀」：書名作者進 works，日期進 records。
 * originId 有值代表這是同一本書的另一次讀，掛到它指的那個作品底下，不另開一本。
 *
 * 出版社與平台是各自獨立的欄位（source／platform）；字數沒有對應欄位——
 * 舊形狀那欄留著只為了型別相容，寫入時丟掉。
 */

const BOOK_KIND = "書籍";

function recordValues(book: Book) {
  return {
    startDate: toDate(book.startDate),
    endDate: toDate(book.endDate),
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
            source: book.publisher,
            platform: book.platform,
            externalId: book.isbn,
            coverUrl: book.coverUrl,
            amount: toInt(book.pageCount),
            topicId: await typeIdFor(tx, userId, book.domain, book.subDomain),
            attributeId: await attributeIdFor(tx, userId, book.type),
          })
          .returning({ id: works.id })
      )[0].id;

    const [record] = await tx
      .insert(records)
      .values({ id: book.id, userId, workId, ...recordValues(book) })
      .returning({ id: records.id });
    await setRecordSourceUrl(tx, userId, record.id, book.sourceUrl);
    await setKeywordLinks(tx, userId, workId, names);
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
  if (patch.pageCount !== undefined) workPatch.amount = toInt(patch.pageCount);
  if (patch.publisher !== undefined) workPatch.source = patch.publisher;
  if (patch.platform !== undefined) workPatch.platform = patch.platform;

  const recordPatch: Record<string, unknown> = {};
  if (patch.startDate !== undefined) recordPatch.startDate = toDate(patch.startDate);
  if (patch.endDate !== undefined) recordPatch.endDate = toDate(patch.endDate);
  if (patch.private !== undefined) recordPatch.isPrivate = patch.private === PRIVATE_MARK;

  await db.transaction(async (tx) => {
    // 分類是 upsert，也就是寫入；跟主體同一個交易才會一起回滾
    if (patch.domain !== undefined || patch.subDomain !== undefined) {
      workPatch.topicId = await typeIdFor(tx, userId, patch.domain ?? "", patch.subDomain ?? "");
    }
    if (patch.type !== undefined)
      workPatch.attributeId = await attributeIdFor(tx, userId, patch.type);

    if (Object.keys(workPatch).length)
      await tx.update(works).set(workPatch).where(eq(works.id, target.workId));
    if (Object.keys(recordPatch).length)
      await tx.update(records).set(recordPatch).where(eq(records.id, id));
    if (patch.sourceUrl !== undefined) await setRecordSourceUrl(tx, userId, id, patch.sourceUrl);
    if (patch.keywords !== undefined)
      await setKeywordLinks(tx, userId, target.workId, splitLines(patch.keywords));
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
    if (count === 0) {
      await tx.delete(works).where(eq(works.id, target.workId));
      await unlinkAll(tx, userId, target.workId);
    }
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
