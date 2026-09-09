import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { externalLinks } from "@/lib/db/schema/external-links";

/**
 * 外部連結查詢。records（書籍／文章）、fragments（佳句／單字／關鍵字）、
 * writings（書寫）共用同一張表，靠 record_id／fragment_id／writing_id
 * 三個外鍵分——一筆連結只會有其中一個非空。
 *
 * 應用層目前只認單一連結（表單一個網址欄），這裡替它在多值表上取一筆——
 * 排序取最早那筆，跟舊欄位「只存一個」的語意最接近。
 */

type Column =
  typeof externalLinks.recordId | typeof externalLinks.fragmentId | typeof externalLinks.writingId;

async function sourceUrlOf(userId: string, column: Column, sourceId: string): Promise<string> {
  const [row] = await db
    .select({ url: externalLinks.url })
    .from(externalLinks)
    .where(and(eq(externalLinks.userId, userId), eq(column, sourceId)))
    .orderBy(asc(externalLinks.sortOrder), asc(externalLinks.createdAt))
    .limit(1);
  return row?.url ?? "";
}

async function sourceUrlsOf(
  userId: string,
  column: Column,
  sourceIds: string[],
): Promise<Map<string, string>> {
  if (!sourceIds.length) return new Map();

  const rows = await db
    .select({ sourceId: column, url: externalLinks.url })
    .from(externalLinks)
    .where(and(eq(externalLinks.userId, userId), inArray(column, sourceIds)))
    .orderBy(asc(externalLinks.sortOrder), asc(externalLinks.createdAt));

  const map = new Map<string, string>();
  for (const row of rows)
    if (row.sourceId && !map.has(row.sourceId)) map.set(row.sourceId, row.url);
  return map;
}

/** 單筆 record 的外部連結，詳情頁用 */
export const sourceUrlOfRecord = (userId: string, recordId: string): Promise<string> =>
  sourceUrlOf(userId, externalLinks.recordId, recordId);

/** 批次查多筆 record 的外部連結，列表頁用避免 N+1 */
export const sourceUrlOfRecords = (
  userId: string,
  recordIds: string[],
): Promise<Map<string, string>> => sourceUrlsOf(userId, externalLinks.recordId, recordIds);

/** 單筆 fragment 的外部連結，詳情頁用 */
export const sourceUrlOfFragment = (userId: string, fragmentId: string): Promise<string> =>
  sourceUrlOf(userId, externalLinks.fragmentId, fragmentId);

/** 批次查多筆 fragment 的外部連結，列表頁用避免 N+1 */
export const sourceUrlOfFragments = (
  userId: string,
  fragmentIds: string[],
): Promise<Map<string, string>> => sourceUrlsOf(userId, externalLinks.fragmentId, fragmentIds);

/** 單筆 writing 的外部連結（發布網址），詳情頁用 */
export const sourceUrlOfWriting = (userId: string, writingId: string): Promise<string> =>
  sourceUrlOf(userId, externalLinks.writingId, writingId);

/** 批次查多筆 writing 的外部連結，列表頁用避免 N+1 */
export const sourceUrlOfWritings = (
  userId: string,
  writingIds: string[],
): Promise<Map<string, string>> => sourceUrlsOf(userId, externalLinks.writingId, writingIds);
