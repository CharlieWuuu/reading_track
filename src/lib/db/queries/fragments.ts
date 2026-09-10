import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { kinds } from "@/lib/db/schema/kinds";
import { works } from "@/lib/db/schema/works";
import { KeywordInfo } from "@/types/keyword";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { decodeCursor, encodeCursor } from "@/utils/pagination";
import { firstReadingIdByBookId } from "./books";
import { sourceUrlOfFragments } from "./external-links";

/**
 * 佳句、單字、關鍵字讀回舊形狀。三種都在 fragments 表裡，靠類型分。
 *
 * 資料庫裡它們指向「作品」，畫面上的書籍編號卻是「某一次讀」——所以出去之前
 * 換成第一次讀的那個編號。work_id 是空的（不是從書上看到的）就留空，
 * 那種列在畫面上是沒有主人的紀錄。
 */

const rowsOfKind = (userId: string, kindName: string) =>
  db
    .select({ fragment: fragments, workTitle: works.title })
    .from(fragments)
    .innerJoin(kinds, eq(kinds.id, fragments.kindId))
    .leftJoin(works, eq(works.id, fragments.workId))
    .where(and(eq(fragments.userId, userId), eq(kinds.name, kindName)))
    .orderBy(asc(fragments.createdAt));

export async function listQuoteRows(userId: string): Promise<QuoteRow[]> {
  const [firstReading, rows] = await Promise.all([
    firstReadingIdByBookId(userId),
    rowsOfKind(userId, "佳句"),
  ]);

  return rows.map(({ fragment, workTitle }) => ({
    id: fragment.id,
    bookId: fragment.workId ? (firstReading.get(fragment.workId) ?? "") : "",
    bookTitle: workTitle ?? "",
    text: fragment.phrase,
    chapter: fragment.locator,
    note: fragment.body,
    date: fragment.date,
    coverUrl: fragment.coverUrl,
  }));
}

type FragmentCursor = { date: string | null; id: string };

export type PagedQuoteRows = {
  rows: QuoteRow[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};

export type PagedVocabularyRows = {
  rows: VocabularyRow[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};

/**
 * 分頁版的一批片段，date 新到舊、沒填日期的排最後（NULLS LAST）。
 *
 * date 可能是 null，一般的 (date, id) tuple keyset 沒辦法直接處理 null 比較，
 * 拆成兩段：游標本身有日期時，「日期更小」或「同日期但 id 更小」或「沒填日期的」
 * 都算後面；游標本身就在沒填日期那一段時，只剩「沒填日期且 id 更小」算後面。
 */
async function pagedRowsOfKind(
  userId: string,
  kindName: string,
  { cursor, limit }: { cursor?: string | null; limit: number },
) {
  const after = decodeCursor<FragmentCursor>(cursor);

  const keysetCondition = after
    ? after.date !== null
      ? or(
          sql`${fragments.date} < ${after.date}`,
          and(eq(fragments.date, after.date), sql`${fragments.id} < ${after.id}`),
          isNull(fragments.date),
        )
      : and(isNull(fragments.date), sql`${fragments.id} < ${after.id}`)
    : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({ fragment: fragments, workTitle: works.title })
      .from(fragments)
      .innerJoin(kinds, eq(kinds.id, fragments.kindId))
      .leftJoin(works, eq(works.id, fragments.workId))
      .where(and(eq(fragments.userId, userId), eq(kinds.name, kindName), keysetCondition))
      .orderBy(sql`${fragments.date} DESC NULLS LAST`, desc(fragments.id))
      .limit(limit + 1),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(fragments)
      .innerJoin(kinds, eq(kinds.id, fragments.kindId))
      .where(and(eq(fragments.userId, userId), eq(kinds.name, kindName))),
  ]);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);
  const nextCursor =
    hasMore && last
      ? encodeCursor({ date: last.fragment.date, id: last.fragment.id } satisfies FragmentCursor)
      : null;

  return { page, nextCursor, hasMore, total: count };
}

export async function listDoneQuoteRows(
  userId: string,
  opts: { cursor?: string | null; limit: number },
): Promise<PagedQuoteRows> {
  const { page, nextCursor, hasMore, total } = await pagedRowsOfKind(userId, "佳句", opts);
  const firstReading = await firstReadingIdByBookId(userId);

  return {
    rows: page.map(({ fragment, workTitle }) => ({
      id: fragment.id,
      bookId: fragment.workId ? (firstReading.get(fragment.workId) ?? "") : "",
      bookTitle: workTitle ?? "",
      text: fragment.phrase,
      chapter: fragment.locator,
      note: fragment.body,
      date: fragment.date,
      coverUrl: fragment.coverUrl,
    })),
    nextCursor,
    hasMore,
    total,
  };
}

export async function listDoneVocabularyRows(
  userId: string,
  opts: { cursor?: string | null; limit: number },
): Promise<PagedVocabularyRows> {
  const { page, nextCursor, hasMore, total } = await pagedRowsOfKind(userId, "單字", opts);
  const firstReading = await firstReadingIdByBookId(userId);

  return {
    rows: page.map(({ fragment, workTitle }) => ({
      id: fragment.id,
      bookId: fragment.workId ? (firstReading.get(fragment.workId) ?? "") : "",
      bookTitle: workTitle ?? "",
      word: fragment.name,
      pronunciation: fragment.pronunciation,
      wordTranslation: fragment.translation,
      sentence: fragment.context,
      sentenceTranslation: fragment.contextTranslation,
      chapter: fragment.locator,
      language: "",
      createdAt: fragment.createdAt.toISOString(),
      date: fragment.date,
      coverUrl: fragment.coverUrl,
    })),
    nextCursor,
    hasMore,
    total,
  };
}

export async function listVocabularyRows(userId: string): Promise<VocabularyRow[]> {
  const [firstReading, rows] = await Promise.all([
    firstReadingIdByBookId(userId),
    rowsOfKind(userId, "單字"),
  ]);

  return rows.map(({ fragment, workTitle }) => ({
    id: fragment.id,
    bookId: fragment.workId ? (firstReading.get(fragment.workId) ?? "") : "",
    bookTitle: workTitle ?? "",
    word: fragment.name,
    pronunciation: fragment.pronunciation,
    wordTranslation: fragment.translation,
    sentence: fragment.context,
    sentenceTranslation: fragment.contextTranslation,
    chapter: fragment.locator,
    language: "", // 語言在作品那一層，單字自己不帶
    createdAt: fragment.createdAt.toISOString(),
    date: fragment.date,
    coverUrl: fragment.coverUrl,
  }));
}

/** 關鍵字的舊形狀以名字當身分，新表有自己的編號，出去之前還原成名字 */
export async function listKeywords(userId: string): Promise<KeywordInfo[]> {
  const rows = await rowsOfKind(userId, "關鍵字");
  const wikiUrls = await sourceUrlOfFragments(
    userId,
    rows.map(({ fragment }) => fragment.id),
  );

  return rows
    .map(({ fragment }) => ({
      name: fragment.name,
      tags: fragment.tags,
      coordinates: fragment.coordinates,
      span: fragment.span,
      wikiUrl: wikiUrls.get(fragment.id) ?? "",
      summary: fragment.body,
      createdAt: fragment.createdAt.toISOString(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
