import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db/client";
import { kinds } from "@/lib/db/schema/kinds";
import { writingTopics } from "@/lib/db/schema/taxonomy";
import { works } from "@/lib/db/schema/works";
import { writings } from "@/lib/db/schema/writings";
import { Writing } from "@/types/writing";
import { decodeCursor, encodeCursor } from "@/utils/pagination";
import { firstReadingIdByBookId } from "./books";
import { sourceUrlOfWritings } from "./external-links";
import { keywordNamesByOwner } from "./internal-links";

/**
 * 書寫讀回舊形狀。
 *
 * kind 只回傳這則書寫自己的類型；出處的類型另外用 sourceKind 回傳，
 * 兩者不合併——之前合併顯示（有出處時 kind 被出處類型蓋掉）是錯誤設計，
 * 同一份內容因為「有沒有連結出處」就顯示不同類型，沒辦法拿來做篩選或統計。
 */

/** 延伸自書或文章、卻沒特別選主題的，顯示成「心得」——這是顯示才有的詞，
 * 不寫進 writing_topics：讀完寫下的反應本來就不必每次都挑一個主題 */
const IMPLIED_TOPIC = "心得";

/** 出處的類型：這一則掛在書上還是文章上，舊形狀的 kind 欄要它 */
const sourceKind = alias(kinds, "source_kind");

const baseSelect = () =>
  db
    .select({
      writing: writings,
      workTitle: works.title,
      workKind: sourceKind.name,
      topicName: writingTopics.name,
    })
    .from(writings)
    .innerJoin(kinds, eq(kinds.id, writings.kindId))
    .leftJoin(works, eq(works.id, writings.workId))
    .leftJoin(sourceKind, eq(sourceKind.id, works.kindId))
    .leftJoin(writingTopics, eq(writingTopics.id, writings.topicId));

type WritingJoinRow = {
  writing: typeof writings.$inferSelect;
  workTitle: string | null;
  workKind: string | null;
  topicName: string | null;
};

/** 撈出來的原始列轉成 Writing——出處連結、關鍵字這些批次查詢一起做，跟分不分頁無關 */
async function toWritings(userId: string, rows: WritingJoinRow[]): Promise<Writing[]> {
  const [firstReading, links, keywords] = await Promise.all([
    firstReadingIdByBookId(userId),
    sourceUrlOfWritings(
      userId,
      rows.map(({ writing }) => writing.id),
    ),
    keywordNamesByOwner(
      userId,
      rows.map(({ writing }) => writing.id),
    ),
  ]);

  return rows.map(({ writing, workTitle, workKind, topicName }) => {
    // 畫面上的書籍編號是「某一次讀」，所以指回第一次讀的那個
    const sourceId = writing.workId ? (firstReading.get(writing.workId) ?? writing.workId) : "";
    return {
      id: writing.id,
      createdAt: writing.createdAt.toISOString(),
      date: writing.date,
      title: writing.name,
      topic: topicName ?? (writing.workId ? IMPLIED_TOPIC : ""),
      keywords: keywords.get(writing.id) ?? "",
      note: writing.body,
      link: links.get(writing.id) ?? "",
      sourceTitle: workTitle ?? "",
      sourceKind: workKind ?? "",
      sourceId,
      private: "", // 書寫不帶私人旗標，藏東西一律從主題與類型下手
      coverUrl: writing.coverUrl,
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
          sql`${writings.date} < ${after.date}`,
          and(eq(writings.date, after.date), sql`${writings.id} < ${after.id}`),
          isNull(writings.date),
        )
      : and(isNull(writings.date), sql`${writings.id} < ${after.id}`)
    : undefined;

  const [rows, [{ count }]] = await Promise.all([
    baseSelect()
      .where(and(eq(writings.userId, userId), keysetCondition))
      .orderBy(sql`${writings.date} DESC NULLS LAST`, desc(writings.id))
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
      ? encodeCursor({ date: last.writing.date, id: last.writing.id } satisfies WritingCursor)
      : null;

  return { rows: await toWritings(userId, page), nextCursor, hasMore, total: count };
}
