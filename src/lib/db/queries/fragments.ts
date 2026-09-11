import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { kinds } from "@/lib/db/schema/kinds";
import { works } from "@/lib/db/schema/works";
import { KeywordInfo } from "@/types/keyword";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { decodeCursor, encodeCursor } from "@/utils/pagination";
import { firstReadingIdByBookId } from "./books";
import { sourceUrlOfFragments } from "./external-links";
import { linkedIdsOfMany } from "./internal-links";

/**
 * 佳句、單字、關鍵字讀回舊形狀。三種都在 fragments 表裡，靠類型分。
 *
 * 跟作品的關聯走 internal_links，不是自己的欄位——查一批片段連到哪個作品，
 * 用 fragment id 去 internal_links 反查，對方若是作品就是它的出處。
 *
 * 資料庫裡它們指向「作品」，畫面上的書籍編號卻是「某一次讀」——所以出去之前
 * 換成第一次讀的那個編號。沒連到作品的就留空，那種列在畫面上是沒有主人的紀錄。
 */

const rowsOfKind = (userId: string, kindName: string) =>
  db
    .select({ fragment: fragments })
    .from(fragments)
    .innerJoin(kinds, eq(kinds.id, fragments.kindId))
    .where(and(eq(fragments.userId, userId), eq(kinds.name, kindName)))
    .orderBy(asc(fragments.createdAt));

/** 一批片段各自連到哪個作品（id 與書名），片段對作品最多一個，取連到的第一個作品 */
export async function worksOfFragments(
  userId: string,
  fragmentIds: string[],
): Promise<Map<string, { id: string; title: string }>> {
  const linked = await linkedIdsOfMany(userId, fragmentIds);
  const otherIds = [...new Set([...linked.values()].flat())];
  if (!otherIds.length) return new Map();

  const workRows = await db
    .select({ id: works.id, title: works.title })
    .from(works)
    .where(and(eq(works.userId, userId), inArray(works.id, otherIds)));
  const workById = new Map(workRows.map((row) => [row.id, row]));

  const result = new Map<string, { id: string; title: string }>();
  for (const [fragmentId, ids] of linked) {
    const work = ids.map((id) => workById.get(id)).find((row) => row !== undefined);
    if (work) result.set(fragmentId, work);
  }
  return result;
}

export async function listQuoteRows(userId: string): Promise<QuoteRow[]> {
  const rows = await rowsOfKind(userId, "佳句");
  const [firstReading, worksByFragment] = await Promise.all([
    firstReadingIdByBookId(userId),
    worksOfFragments(
      userId,
      rows.map(({ fragment }) => fragment.id),
    ),
  ]);

  return rows.map(({ fragment }) => {
    const work = worksByFragment.get(fragment.id);
    return {
      id: fragment.id,
      bookId: work ? (firstReading.get(work.id) ?? "") : "",
      bookTitle: work?.title ?? "",
      text: fragment.phrase,
      chapter: fragment.locator,
      note: fragment.body,
      date: fragment.date,
      coverUrl: fragment.coverUrl,
    };
  });
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
      .select({ fragment: fragments })
      .from(fragments)
      .innerJoin(kinds, eq(kinds.id, fragments.kindId))
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
  const [firstReading, worksByFragment] = await Promise.all([
    firstReadingIdByBookId(userId),
    worksOfFragments(
      userId,
      page.map(({ fragment }) => fragment.id),
    ),
  ]);

  return {
    rows: page.map(({ fragment }) => {
      const work = worksByFragment.get(fragment.id);
      return {
        id: fragment.id,
        bookId: work ? (firstReading.get(work.id) ?? "") : "",
        bookTitle: work?.title ?? "",
        text: fragment.phrase,
        chapter: fragment.locator,
        note: fragment.body,
        date: fragment.date,
        coverUrl: fragment.coverUrl,
      };
    }),
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
  const [firstReading, worksByFragment] = await Promise.all([
    firstReadingIdByBookId(userId),
    worksOfFragments(
      userId,
      page.map(({ fragment }) => fragment.id),
    ),
  ]);

  return {
    rows: page.map(({ fragment }) => {
      const work = worksByFragment.get(fragment.id);
      return {
        id: fragment.id,
        bookId: work ? (firstReading.get(work.id) ?? "") : "",
        bookTitle: work?.title ?? "",
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
      };
    }),
    nextCursor,
    hasMore,
    total,
  };
}

export async function listVocabularyRows(userId: string): Promise<VocabularyRow[]> {
  const rows = await rowsOfKind(userId, "單字");
  const [firstReading, worksByFragment] = await Promise.all([
    firstReadingIdByBookId(userId),
    worksOfFragments(
      userId,
      rows.map(({ fragment }) => fragment.id),
    ),
  ]);

  return rows.map(({ fragment }) => {
    const work = worksByFragment.get(fragment.id);
    return {
      id: fragment.id,
      bookId: work ? (firstReading.get(work.id) ?? "") : "",
      bookTitle: work?.title ?? "",
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
    };
  });
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
