import { asc, eq } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/privacy";
import { db } from "@/lib/db/client";
import { articleKeywords } from "@/lib/db/schema/keyword-links";
import { articles } from "@/lib/db/schema/reading";
import { attributes } from "@/lib/db/schema/taxonomy";
import { Article } from "@/types/article";
import { typePaths } from "./taxonomy";

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
      .select({ article: articles, attribute: attributes.name })
      .from(articles)
      .leftJoin(attributes, eq(attributes.id, articles.attributeId))
      .where(eq(articles.userId, userId))
      .orderBy(asc(articles.createdAt)),
  ]);

  return rows.map(({ article, attribute }) => {
    const type = article.typeId ? types.get(article.typeId) : undefined;
    return {
      id: article.id,
      title: article.title,
      author: article.author,
      platform: article.platform,
      sourceUrl: article.sourceUrl,
      endDate: article.endDate,
      domain: type?.domain ?? "",
      subDomain: type?.subDomain ?? "",
      type: attribute ?? "",
      language: article.language,
      note: "", // 心得搬去書寫了，這欄留著只為了型別相容
      keywords: (keywords.get(article.id) ?? []).join("\n"),
      private: article.isPrivate ? PRIVATE_MARK : "",
    };
  });
}
