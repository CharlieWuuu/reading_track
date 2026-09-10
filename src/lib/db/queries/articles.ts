import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/privacy";
import { db } from "@/lib/db/client";
import { kinds } from "@/lib/db/schema/kinds";
import { attributes } from "@/lib/db/schema/taxonomy";
import { records, works } from "@/lib/db/schema/works";
import { Article } from "@/types/article";
import { decodeCursor, encodeCursor } from "@/utils/pagination";
import { sourceUrlOfRecords } from "./external-links";
import { keywordNamesByOwner } from "./internal-links";
import { typePaths } from "./taxonomy";

/** 文章的作品編號沿用搬遷前的 article.id */
const ARTICLE_KIND = "文章";

type ArticleJoinRow = {
  record: typeof records.$inferSelect;
  work: typeof works.$inferSelect;
  attribute: string | null;
};

/** 撈出來的原始列轉成 Article——關鍵字、出處連結這些批次查詢一起做，跟分不分頁無關 */
async function toArticles(userId: string, rows: ArticleJoinRow[]): Promise<Article[]> {
  const [types, keywords, sourceUrls] = await Promise.all([
    typePaths(userId),
    keywordNamesByOwner(
      userId,
      rows.map(({ work }) => work.id),
    ),
    sourceUrlOfRecords(
      userId,
      rows.map(({ record }) => record.id),
    ),
  ]);

  return rows.map(({ record, work, attribute }) => {
    const type = work.topicId ? types.get(work.topicId) : undefined;
    return {
      id: record.id,
      createdAt: record.createdAt.toISOString(),
      title: work.title,
      author: work.creator,
      platform: work.source,
      sourceUrl: sourceUrls.get(record.id) ?? "",
      endDate: record.endDate,
      domain: type?.domain ?? "",
      subDomain: type?.subDomain ?? "",
      type: attribute ?? "",
      language: work.language,
      note: "", // 心得搬去書寫了，這欄留著只為了型別相容
      keywords: keywords.get(work.id) ?? "",
      private: record.isPrivate ? PRIVATE_MARK : "",
    };
  });
}

export async function listArticles(userId: string): Promise<Article[]> {
  const rows = await db
    .select({ record: records, work: works, attribute: attributes.name })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .innerJoin(kinds, eq(kinds.id, works.kindId))
    .leftJoin(attributes, eq(attributes.id, works.attributeId))
    .where(and(eq(records.userId, userId), eq(kinds.name, ARTICLE_KIND)))
    .orderBy(asc(records.createdAt));

  return toArticles(userId, rows);
}

/** 待讀（沒有 endDate）——這批小，整批抓不分頁，理由同書籍/紀錄的 active */
export async function listPendingArticles(userId: string): Promise<Article[]> {
  const rows = await db
    .select({ record: records, work: works, attribute: attributes.name })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .innerJoin(kinds, eq(kinds.id, works.kindId))
    .leftJoin(attributes, eq(attributes.id, works.attributeId))
    .where(and(eq(records.userId, userId), eq(kinds.name, ARTICLE_KIND), isNull(records.endDate)))
    .orderBy(asc(records.createdAt));

  return toArticles(userId, rows);
}

type DoneCursor = { endDate: string; id: string };

export type PagedArticles = {
  rows: Article[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};

/** 讀完的，keyset 分頁——鍵用 (endDate, id)，跟畫面排序（新到舊）一致 */
export async function listDoneArticles(
  userId: string,
  { cursor, limit }: { cursor?: string | null; limit: number },
): Promise<PagedArticles> {
  const after = decodeCursor<DoneCursor>(cursor);

  const [rawRows, [{ count }]] = await Promise.all([
    db
      .select({ record: records, work: works, attribute: attributes.name })
      .from(records)
      .innerJoin(works, eq(works.id, records.workId))
      .innerJoin(kinds, eq(kinds.id, works.kindId))
      .leftJoin(attributes, eq(attributes.id, works.attributeId))
      .where(
        and(
          eq(records.userId, userId),
          eq(kinds.name, ARTICLE_KIND),
          isNotNull(records.endDate),
          after
            ? sql`(${records.endDate}, ${records.id}) < (${after.endDate}, ${after.id})`
            : undefined,
        ),
      )
      .orderBy(desc(records.endDate), desc(records.id))
      .limit(limit + 1),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(records)
      .innerJoin(works, eq(works.id, records.workId))
      .innerJoin(kinds, eq(kinds.id, works.kindId))
      .where(
        and(eq(records.userId, userId), eq(kinds.name, ARTICLE_KIND), isNotNull(records.endDate)),
      ),
  ]);

  const hasMore = rawRows.length > limit;
  const page = hasMore ? rawRows.slice(0, limit) : rawRows;
  const last = page.at(-1);
  const nextCursor =
    hasMore && last
      ? encodeCursor({ endDate: last.record.endDate!, id: last.record.id } satisfies DoneCursor)
      : null;

  return { rows: await toArticles(userId, page), nextCursor, hasMore, total: count };
}
