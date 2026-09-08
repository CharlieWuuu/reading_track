import { and, asc, eq } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/privacy";
import { db } from "@/lib/db/client";
import { kinds } from "@/lib/db/schema/kinds";
import { bookAttributes } from "@/lib/db/schema/taxonomy";
import { records, works } from "@/lib/db/schema/works";
import { Article } from "@/types/article";
import { sourceUrlOfRecords } from "./external-links";
import { keywordNamesByOwner } from "./internal-links";
import { typePaths } from "./taxonomy";

/** 文章的作品編號沿用搬遷前的 article.id */
const ARTICLE_KIND = "文章";

export async function listArticles(userId: string): Promise<Article[]> {
  const [types, rows] = await Promise.all([
    typePaths(userId),
    db
      .select({ record: records, work: works, attribute: bookAttributes.name })
      .from(records)
      .innerJoin(works, eq(works.id, records.workId))
      .innerJoin(kinds, eq(kinds.id, works.kindId))
      .leftJoin(bookAttributes, eq(bookAttributes.id, works.attributeId))
      .where(and(eq(records.userId, userId), eq(kinds.name, ARTICLE_KIND)))
      .orderBy(asc(records.createdAt)),
  ]);
  const [keywords, sourceUrls] = await Promise.all([
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
