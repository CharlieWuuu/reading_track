import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { kinds } from "@/lib/db/schema/kinds";
import { writings } from "@/lib/db/schema/writings";
import { Writing } from "@/types/writing";
import { decodeCursor, encodeCursor } from "@/utils/pagination";
import { firstReadingIdByBookId } from "./books";
import { sourceUrlOfWritings } from "./external-links";
import { keywordNamesByOwner, sourceWorkOfWritings } from "./internal-links";

/**
 * 書寫讀回舊形狀。
 *
 * kind 只回傳這則書寫自己的類型；出處的類型另外用 sourceKind 回傳，
 * 兩者不合併——之前合併顯示（有出處時 kind 被出處類型蓋掉）是錯誤設計，
 * 同一份內容因為「有沒有連結出處」就顯示不同類型，沒辦法拿來做篩選或統計。
 */

const baseSelect = () =>
  db
    .select({
      writing: writings,
      kindName: kinds.name,
      kindCountUnit: kinds.countUnit,
      kindCardStyle: kinds.cardStyle,
      kindSlug: kinds.slug,
    })
    .from(writings)
    .innerJoin(kinds, eq(kinds.id, writings.kindId));

type WritingJoinRow = {
  writing: typeof writings.$inferSelect;
  kindName: string;
  kindCountUnit: string;
  kindCardStyle: string;
  kindSlug: string;
};

/** 撈出來的原始列轉成 Writing——出處連結、關鍵字這些批次查詢一起做，跟分不分頁無關 */
async function toWritings(userId: string, rows: WritingJoinRow[]): Promise<Writing[]> {
  const ids = rows.map(({ writing }) => writing.id);
  const [firstReading, links, keywords, sourceWork] = await Promise.all([
    firstReadingIdByBookId(userId),
    sourceUrlOfWritings(userId, ids),
    keywordNamesByOwner(userId, ids),
    sourceWorkOfWritings(userId, ids),
  ]);

  return rows.map(({ writing, kindName, kindCountUnit, kindCardStyle, kindSlug }) => {
    const work = sourceWork.get(writing.id);
    // 畫面上的書籍編號是「某一次讀」，所以指回第一次讀的那個
    const sourceId = work ? (firstReading.get(work.id) ?? work.id) : "";
    return {
      id: writing.id,
      createdAt: writing.createdAt.toISOString(),
      endDate: writing.endDate,
      title: writing.title,
      topic: kindName, // 分類已經是 kind，topic 欄留著給篩選與統計沿用同一個名字
      keywords: keywords.get(writing.id) ?? "",
      note: writing.body,
      link: links.get(writing.id) ?? "",
      sourceTitle: work?.title ?? "",
      sourceKind: work?.kindName ?? "",
      kindId: writing.kindId,
      kindName,
      kindCountUnit,
      kindCardStyle,
      kindSlug,
      sourceId,
      private: "", // 書寫不帶私人旗標，藏東西一律從主題與類型下手
      coverUrl: work?.coverUrl ?? "", // 封面跟著出處那本書走，書寫自己不存
    };
  });
}

export async function listWritings(userId: string): Promise<Writing[]> {
  const rows = await baseSelect()
    .where(eq(writings.userId, userId))
    .orderBy(asc(writings.createdAt));
  return toWritings(userId, rows);
}

type WritingCursor = { date: string | null; id: string };

export type PagedWritings = {
  rows: Writing[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};

/**
 * 概覽頁專用：keyset 分頁，date 新到舊、沒填日期的排最後（NULLS LAST）。
 * 書寫記下就算完成，沒有進行中這個狀態，整批都在這一支裡分頁。
 */
export async function listWritingsPaged(
  userId: string,
  { cursor, limit }: { cursor?: string | null; limit: number },
): Promise<PagedWritings> {
  const after = decodeCursor<WritingCursor>(cursor);

  const keysetCondition = after
    ? after.date !== null
      ? or(
          sql`${writings.endDate} < ${after.date}`,
          and(eq(writings.endDate, after.date), sql`${writings.id} < ${after.id}`),
          isNull(writings.endDate),
        )
      : and(isNull(writings.endDate), sql`${writings.id} < ${after.id}`)
    : undefined;

  const [rows, [{ count }]] = await Promise.all([
    baseSelect()
      .where(and(eq(writings.userId, userId), keysetCondition))
      .orderBy(sql`${writings.endDate} DESC NULLS LAST`, desc(writings.id))
      .limit(limit + 1),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(writings)
      .where(eq(writings.userId, userId)),
  ]);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);
  const nextCursor =
    hasMore && last
      ? encodeCursor({ date: last.writing.endDate, id: last.writing.id } satisfies WritingCursor)
      : null;

  return { rows: await toWritings(userId, page), nextCursor, hasMore, total: count };
}
