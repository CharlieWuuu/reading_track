import { eq } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/privacy";
import { db, type Tx } from "@/lib/db/client";
import { articleKeywords } from "@/lib/db/schema/keyword-links";
import { articles } from "@/lib/db/schema/reading";
import { keywords } from "@/lib/db/schema/taxonomy";
import { Article } from "@/types/article";
import { splitLines } from "@/types/book";
import { attributeIdFor, typeIdFor } from "./taxonomy";
import { toDate } from "./values";

async function setKeywords(tx: Tx, articleId: string, names: string[]): Promise<void> {
  if (names.length)
    await tx
      .insert(keywords)
      .values(names.map((name) => ({ name })))
      .onConflictDoNothing();
  await tx.delete(articleKeywords).where(eq(articleKeywords.articleId, articleId));
  if (names.length)
    await tx.insert(articleKeywords).values(names.map((keyword) => ({ articleId, keyword })));
}

export async function addArticleRow(article: Article): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(articles).values({
      id: article.id,
      title: article.title,
      author: article.author,
      platform: article.platform,
      sourceUrl: article.sourceUrl,
      endDate: toDate(article.endDate),
      language: article.language,
      typeId: await typeIdFor(tx, article.domain, article.subDomain),
      attributeId: await attributeIdFor(tx, article.type),
      isPrivate: article.private === PRIVATE_MARK,
    });
    await setKeywords(tx, article.id, splitLines(article.keywords));
  });
}

export async function updateArticleRow(id: string, patch: Partial<Article>): Promise<void> {
  const values: Record<string, unknown> = {};
  for (const field of ["title", "author", "platform", "sourceUrl", "language"] as const) {
    if (patch[field] !== undefined) values[field] = patch[field];
  }
  if (patch.endDate !== undefined) values.endDate = toDate(patch.endDate);
  if (patch.private !== undefined) values.isPrivate = patch.private === PRIVATE_MARK;

  await db.transaction(async (tx) => {
    // 分類是 upsert，也就是寫入；跟主體同一個交易才會一起回滾
    if (patch.domain !== undefined || patch.subDomain !== undefined) {
      values.typeId = await typeIdFor(tx, patch.domain ?? "", patch.subDomain ?? "");
    }
    if (patch.type !== undefined) values.attributeId = await attributeIdFor(tx, patch.type);

    if (Object.keys(values).length)
      await tx.update(articles).set(values).where(eq(articles.id, id));
    if (patch.keywords !== undefined) await setKeywords(tx, id, splitLines(patch.keywords));
  });
}

export async function deleteArticleRow(id: string): Promise<void> {
  await db.delete(articles).where(eq(articles.id, id));
}
