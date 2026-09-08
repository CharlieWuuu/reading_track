import { and, asc, eq } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/privacy";
import { db } from "@/lib/db/client";
import { articleKeywords } from "@/lib/db/schema/keyword-links";
import { recordKinds } from "@/lib/db/schema/kinds";
import { attributes } from "@/lib/db/schema/taxonomy";
import { records, works } from "@/lib/db/schema/works";
import { Article } from "@/types/article";
import { typePaths } from "./taxonomy";

/** 文章的作品編號沿用搬遷前的 article.id，所以 article_keywords 還對得上 */
const ARTICLE_KIND = "文章";

async function keywordsByArticle(userId: string): Promise<Map<string, string[]>> {
  const rows = await db
    .select({ articleId: articleKeywords.articleId, keyword: articleKeywords.keyword })
    .from(articleKeywords)
    .where(eq(articleKeywords.userId, userId))
    .orderBy(asc(articleKeywords.keyword));

  const map = new Map<string, string[]>();
  for (const row of rows) map.set(row.articleId, [...(map.get(row.articleId) ?? []), row.keyword]);
  return map;
}

export async function listArticles(userId: string): Promise<Article[]> {
  const [types, keywords, rows] = await Promise.all([
    typePaths(userId),
    keywordsByArticle(userId),
    db
      .select({ record: records, work: works, attribute: attributes.name })
      .from(records)
      .innerJoin(works, eq(works.id, records.workId))
      .innerJoin(recordKinds, eq(recordKinds.id, works.kindId))
      .leftJoin(attributes, eq(attributes.id, works.attributeId))
      .where(and(eq(records.userId, userId), eq(recordKinds.name, ARTICLE_KIND)))
      .orderBy(asc(records.createdAt)),
  ]);

  return rows.map(({ record, work, attribute }) => {
    const type = work.topicId ? types.get(work.topicId) : undefined;
    return {
      id: record.id,
      createdAt: record.createdAt.toISOString(),
      title: work.title,
      author: work.creator,
      platform: record.source,
      sourceUrl: record.sourceUrl,
      endDate: record.endDate,
      domain: type?.domain ?? "",
      subDomain: type?.subDomain ?? "",
      type: attribute ?? "",
      language: work.language,
      note: "", // 心得搬去書寫了，這欄留著只為了型別相容
      keywords: (keywords.get(work.id) ?? []).join("\n"),
      private: record.isPrivate ? PRIVATE_MARK : "",
    };
  });
}
