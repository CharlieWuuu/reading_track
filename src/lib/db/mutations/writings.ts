import { eq } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/privacy";
import { db, type Tx } from "@/lib/db/client";
import { writingKeywords } from "@/lib/db/schema/keyword-links";
import { articles, readings } from "@/lib/db/schema/reading";
import { keywords, writingTypes } from "@/lib/db/schema/taxonomy";
import { metrics, writings } from "@/lib/db/schema/writing";
import { splitLines } from "@/types/book";
import { Metric } from "@/types/metric";
import { Writing } from "@/types/writing";
import { toDate } from "./values";

/**
 * 書寫寫回資料表。
 *
 * 舊的 kind 欄混了出處與類型：「書籍」「文章」只是在說它有出處，那件事現在由
 * 外鍵記；其餘的值才是真的類型。sourceId 進來的是「某一次讀」的編號，
 * 要換成它屬於哪本書。
 */

const SOURCE_KINDS = ["書籍", "文章"];

async function typeIdFor(tx: Tx, kind: string): Promise<string | null> {
  const name = kind.trim();
  if (!name || SOURCE_KINDS.includes(name)) return null;

  const [row] = await tx
    .insert(writingTypes)
    .values({ name })
    .onConflictDoUpdate({ target: writingTypes.name, set: { name } })
    .returning({ id: writingTypes.id });
  return row.id;
}

/** sourceId 可能是某一次讀，也可能是一篇文章；分別找出來 */
async function sourceFor(
  sourceId: string,
): Promise<{ bookId: string | null; articleId: string | null }> {
  const id = sourceId.trim();
  if (!id) return { bookId: null, articleId: null };

  const [reading] = await db
    .select({ bookId: readings.bookId })
    .from(readings)
    .where(eq(readings.id, id));
  if (reading) return { bookId: reading.bookId, articleId: null };

  const [article] = await db.select({ id: articles.id }).from(articles).where(eq(articles.id, id));
  return { bookId: null, articleId: article?.id ?? null };
}

async function setKeywords(tx: Tx, writingId: string, names: string[]): Promise<void> {
  if (names.length)
    await tx
      .insert(keywords)
      .values(names.map((name) => ({ name })))
      .onConflictDoNothing();
  await tx.delete(writingKeywords).where(eq(writingKeywords.writingId, writingId));
  if (names.length)
    await tx.insert(writingKeywords).values(names.map((keyword) => ({ writingId, keyword })));
}

export async function addWritingRow(writing: Writing): Promise<void> {
  const source = await sourceFor(writing.sourceId);
  await db.transaction(async (tx) => {
    await tx.insert(writings).values({
      id: writing.id,
      ...source,
      typeId: await typeIdFor(tx, writing.kind),
      title: writing.title,
      note: writing.note,
      date: toDate(writing.date),
      link: writing.link,
      isPrivate: writing.private === PRIVATE_MARK,
    });
    await setKeywords(tx, writing.id, splitLines(writing.keywords));
  });
}

export async function addWritingRows(rows: Writing[]): Promise<void> {
  for (const row of rows) await addWritingRow(row);
}

export async function updateWritingRow(id: string, patch: Partial<Writing>): Promise<void> {
  const values: Record<string, unknown> = {};
  if (patch.title !== undefined) values.title = patch.title;
  if (patch.note !== undefined) values.note = patch.note;
  if (patch.date !== undefined) values.date = toDate(patch.date);
  if (patch.link !== undefined) values.link = patch.link;
  if (patch.private !== undefined) values.isPrivate = patch.private === PRIVATE_MARK;
  if (patch.sourceId !== undefined) Object.assign(values, await sourceFor(patch.sourceId));

  await db.transaction(async (tx) => {
    // 類型是 upsert，也就是寫入；跟主體同一個交易才會一起回滾
    if (patch.kind !== undefined) values.typeId = await typeIdFor(tx, patch.kind);

    if (Object.keys(values).length)
      await tx.update(writings).set(values).where(eq(writings.id, id));
    if (patch.keywords !== undefined) await setKeywords(tx, id, splitLines(patch.keywords));
  });
}

export async function deleteWritingRow(id: string): Promise<void> {
  await db.delete(writings).where(eq(writings.id, id));
}

/** 每次量測都是新的一列，不覆蓋舊的——累積起來就是成長曲線 */
export async function addMetricRow(metric: Metric): Promise<void> {
  await db.insert(metrics).values({
    id: metric.id,
    writingId: metric.writingId,
    date: metric.date,
    platform: metric.platform,
    views: Number(metric.views) || null,
    reads: Number(metric.reads) || null,
  });
}
