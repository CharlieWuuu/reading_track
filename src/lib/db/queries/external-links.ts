import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { externalLinks } from "@/lib/db/schema/external-links";

/**
 * 外部連結查詢。records（書籍／文章）與 fragments（佳句／單字／關鍵字／書寫）
 * 共用同一張表，靠 source_type 分。
 *
 * 應用層目前只認單一連結（表單一個網址欄），這裡替它在多值表上取一筆——
 * 排序取最早那筆，跟舊欄位「只存一個」的語意最接近。
 */

type SourceType = "record" | "fragment";

async function sourceUrlOf(
  userId: string,
  sourceType: SourceType,
  sourceId: string,
): Promise<string> {
  const [row] = await db
    .select({ url: externalLinks.url })
    .from(externalLinks)
    .where(
      and(
        eq(externalLinks.userId, userId),
        eq(externalLinks.sourceType, sourceType),
        eq(externalLinks.sourceId, sourceId),
      ),
    )
    .orderBy(asc(externalLinks.sortOrder), asc(externalLinks.createdAt))
    .limit(1);
  return row?.url ?? "";
}

async function sourceUrlsOf(
  userId: string,
  sourceType: SourceType,
  sourceIds: string[],
): Promise<Map<string, string>> {
  if (!sourceIds.length) return new Map();

  const rows = await db
    .select({ sourceId: externalLinks.sourceId, url: externalLinks.url })
    .from(externalLinks)
    .where(
      and(
        eq(externalLinks.userId, userId),
        eq(externalLinks.sourceType, sourceType),
        inArray(externalLinks.sourceId, sourceIds),
      ),
    )
    .orderBy(asc(externalLinks.sortOrder), asc(externalLinks.createdAt));

  const map = new Map<string, string>();
  for (const row of rows) if (!map.has(row.sourceId)) map.set(row.sourceId, row.url);
  return map;
}

/** 單筆 record 的外部連結，詳情頁用 */
export const sourceUrlOfRecord = (userId: string, recordId: string): Promise<string> =>
  sourceUrlOf(userId, "record", recordId);

/** 批次查多筆 record 的外部連結，列表頁用避免 N+1 */
export const sourceUrlOfRecords = (
  userId: string,
  recordIds: string[],
): Promise<Map<string, string>> => sourceUrlsOf(userId, "record", recordIds);

/** 單筆 fragment 的外部連結，詳情頁用 */
export const sourceUrlOfFragment = (userId: string, fragmentId: string): Promise<string> =>
  sourceUrlOf(userId, "fragment", fragmentId);

/** 批次查多筆 fragment 的外部連結，列表頁用避免 N+1 */
export const sourceUrlOfFragments = (
  userId: string,
  fragmentIds: string[],
): Promise<Map<string, string>> => sourceUrlsOf(userId, "fragment", fragmentIds);
