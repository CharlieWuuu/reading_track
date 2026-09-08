import { and, eq } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/privacy";
import { db, type Tx } from "@/lib/db/client";
import { mapArticleKeyword } from "@/lib/db/schema/keyword-links";
import { keywords } from "@/lib/db/schema/taxonomy";
import { records, works } from "@/lib/db/schema/works";
import { Article } from "@/types/article";
import { splitLines } from "@/types/book";
import { setRecordSourceUrl } from "./external-links";
import { kindIdByName } from "./kind-lookup";
import { attributeIdFor, typeIdFor } from "./taxonomy";
import { toDate } from "./values";

/**
 * 舊的 Article 形狀寫回 works／records。
 *
 * 文章沒有重讀，所以作品與紀錄一對一，兩者共用同一個編號——關聯表指的是作品，
 * 網址指的是紀錄，編號一樣就不用換算。
 *
 * 有完成日就是讀完了，沒有就是想讀：舊形狀沒有狀態欄，狀態由日期推出來。
 */

const ARTICLE_KIND = "文章";

async function setKeywords(
  tx: Tx,
  userId: string,
  articleId: string,
  names: string[],
): Promise<void> {
  if (names.length)
    await tx
      .insert(keywords)
      .values(names.map((name) => ({ userId, name })))
      .onConflictDoNothing();
  await tx
    .delete(mapArticleKeyword)
    .where(and(eq(mapArticleKeyword.userId, userId), eq(mapArticleKeyword.articleId, articleId)));
  if (names.length)
    await tx
      .insert(mapArticleKeyword)
      .values(names.map((keyword) => ({ userId, articleId, keyword })));
}

export async function addArticleRow(userId: string, article: Article): Promise<void> {
  await db.transaction(async (tx) => {
    const kindId = await kindIdByName(tx, userId, ARTICLE_KIND);

    await tx.insert(works).values({
      id: article.id,
      userId,
      kindId,
      title: article.title,
      creator: article.author,
      language: article.language,
      source: article.platform,
      topicId: await typeIdFor(tx, userId, article.domain, article.subDomain),
      attributeId: await attributeIdFor(tx, userId, article.type),
    });
    await tx.insert(records).values({
      id: article.id,
      userId,
      workId: article.id,
      endDate: toDate(article.endDate),
      isPrivate: article.private === PRIVATE_MARK,
    });
    await setRecordSourceUrl(tx, userId, article.id, article.sourceUrl);
    await setKeywords(tx, userId, article.id, splitLines(article.keywords));
  });
}

export async function updateArticleRow(
  userId: string,
  id: string,
  patch: Partial<Article>,
): Promise<void> {
  const workPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) workPatch.title = patch.title;
  if (patch.author !== undefined) workPatch.creator = patch.author;
  if (patch.language !== undefined) workPatch.language = patch.language;
  if (patch.platform !== undefined) workPatch.source = patch.platform;

  const recordPatch: Record<string, unknown> = {};
  if (patch.endDate !== undefined) recordPatch.endDate = toDate(patch.endDate);
  if (patch.private !== undefined) recordPatch.isPrivate = patch.private === PRIVATE_MARK;

  await db.transaction(async (tx) => {
    // 分類是 upsert，也就是寫入；跟主體同一個交易才會一起回滾
    if (patch.domain !== undefined || patch.subDomain !== undefined) {
      workPatch.topicId = await typeIdFor(tx, userId, patch.domain ?? "", patch.subDomain ?? "");
    }
    if (patch.type !== undefined)
      workPatch.attributeId = await attributeIdFor(tx, userId, patch.type);

    if (Object.keys(workPatch).length)
      await tx
        .update(works)
        .set(workPatch)
        .where(and(eq(works.userId, userId), eq(works.id, id)));
    if (Object.keys(recordPatch).length)
      await tx
        .update(records)
        .set(recordPatch)
        .where(and(eq(records.userId, userId), eq(records.id, id)));
    if (patch.sourceUrl !== undefined) await setRecordSourceUrl(tx, userId, id, patch.sourceUrl);
    if (patch.keywords !== undefined) await setKeywords(tx, userId, id, splitLines(patch.keywords));
  });
}

/** 作品跟著走：文章一對一，留下空殼沒有意義 */
export async function deleteArticleRow(userId: string, id: string): Promise<void> {
  await db.delete(works).where(and(eq(works.userId, userId), eq(works.id, id)));
}
