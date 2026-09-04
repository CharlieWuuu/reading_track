import { eq } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/sheet-format";
import { db } from "@/lib/db/client";
import { articleKeywords } from "@/lib/db/schema/keyword-links";
import { articles } from "@/lib/db/schema/reading";
import { keywords } from "@/lib/db/schema/taxonomy";
import { Article } from "@/types/article";
import { splitLines } from "@/types/book";
import { attributeIdFor, typeIdFor } from "./taxonomy";

async function setKeywords(articleId: string, names: string[]): Promise<void> {
  if (names.length)
    await db
      .insert(keywords)
      .values(names.map((name) => ({ name })))
      .onConflictDoNothing();
  await db.delete(articleKeywords).where(eq(articleKeywords.articleId, articleId));
  if (names.length)
    await db.insert(articleKeywords).values(names.map((keyword) => ({ articleId, keyword })));
}

export async function addArticleRow(article: Article): Promise<void> {
  await db.transaction(async () => {
    await db.insert(articles).values({
      id: article.id,
      title: article.title,
      author: article.author,
      platform: article.platform,
      sourceUrl: article.sourceUrl,
      endDate: article.endDate,
      language: article.language,
      typeId: await typeIdFor(article.domain, article.subDomain),
      attributeId: await attributeIdFor(article.type),
      isPrivate: article.private === PRIVATE_MARK,
    });
    await setKeywords(article.id, splitLines(article.keywords));
  });
}

export async function updateArticleRow(id: string, patch: Partial<Article>): Promise<void> {
  const values: Record<string, unknown> = {};
  for (const field of [
    "title",
    "author",
    "platform",
    "sourceUrl",
    "endDate",
    "language",
  ] as const) {
    if (patch[field] !== undefined) values[field] = patch[field];
  }
  if (patch.domain !== undefined || patch.subDomain !== undefined) {
    values.typeId = await typeIdFor(patch.domain ?? "", patch.subDomain ?? "");
  }
  if (patch.type !== undefined) values.attributeId = await attributeIdFor(patch.type);
  if (patch.private !== undefined) values.isPrivate = patch.private === PRIVATE_MARK;

  await db.transaction(async () => {
    if (Object.keys(values).length)
      await db.update(articles).set(values).where(eq(articles.id, id));
    if (patch.keywords !== undefined) await setKeywords(id, splitLines(patch.keywords));
  });
}

export async function deleteArticleRow(id: string): Promise<void> {
  await db.delete(articles).where(eq(articles.id, id));
}
