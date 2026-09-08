import { and, eq } from "drizzle-orm";
import { db, type Tx } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { writingKeywords } from "@/lib/db/schema/keyword-links";
import { keywords } from "@/lib/db/schema/taxonomy";
import { records, works } from "@/lib/db/schema/works";
import { metrics } from "@/lib/db/schema/writing";
import { splitLines } from "@/types/book";
import { Metric } from "@/types/metric";
import { Writing } from "@/types/writing";
import { kindIdByName } from "./kind-lookup";
import { toDate } from "./values";

/**
 * 書寫寫回 fragments。跟片段同一張表，差別只在類型屬於哪一堆。
 *
 * 舊的 kind 欄混了出處與類型：「書籍」「文章」只是在說它有出處，那件事現在由
 * work_id 記；其餘的值才是真的類型。sourceId 進來的是「某一次讀」的編號，
 * 要換成它屬於哪個作品。
 *
 * 類型認不得就落到「日記」——不在寫入時替使用者長出新類型，那是他在建立頁上
 * 決定的事。
 */

const SOURCE_KINDS = ["書籍", "文章"];
const FALLBACK_KIND = "日記";

async function kindIdFor(tx: Tx, userId: string, kind: string): Promise<string> {
  const name = kind.trim();
  if (!name || SOURCE_KINDS.includes(name)) return kindIdByName(tx, userId, FALLBACK_KIND);
  try {
    return await kindIdByName(tx, userId, name);
  } catch {
    return kindIdByName(tx, userId, FALLBACK_KIND);
  }
}

/** sourceId 可能是某一次紀錄，也可能就是作品本身（文章一對一） */
async function workIdFor(userId: string, sourceId: string): Promise<string | null> {
  const id = sourceId.trim();
  if (!id) return null;

  const [record] = await db
    .select({ workId: records.workId })
    .from(records)
    .where(and(eq(records.userId, userId), eq(records.id, id)));
  if (record) return record.workId;

  const [work] = await db
    .select({ id: works.id })
    .from(works)
    .where(and(eq(works.userId, userId), eq(works.id, id)));
  return work?.id ?? null;
}

async function setKeywords(
  tx: Tx,
  userId: string,
  writingId: string,
  names: string[],
): Promise<void> {
  if (names.length)
    await tx
      .insert(keywords)
      .values(names.map((name) => ({ userId, name })))
      .onConflictDoNothing();
  await tx
    .delete(writingKeywords)
    .where(and(eq(writingKeywords.userId, userId), eq(writingKeywords.writingId, writingId)));
  if (names.length)
    await tx
      .insert(writingKeywords)
      .values(names.map((keyword) => ({ userId, writingId, keyword })));
}

export async function addWritingRow(userId: string, writing: Writing): Promise<void> {
  const workId = await workIdFor(userId, writing.sourceId);
  await db.transaction(async (tx) => {
    await tx.insert(fragments).values({
      id: writing.id,
      userId,
      kindId: await kindIdFor(tx, userId, writing.kind),
      workId,
      name: writing.title,
      body: writing.note,
      date: toDate(writing.date),
      wikiUrl: writing.link,
    });
    await setKeywords(tx, userId, writing.id, splitLines(writing.keywords));
  });
}

export async function addWritingRows(userId: string, rows: Writing[]): Promise<void> {
  for (const row of rows) await addWritingRow(userId, row);
}

export async function updateWritingRow(
  userId: string,
  id: string,
  patch: Partial<Writing>,
): Promise<void> {
  const values: Record<string, unknown> = {};
  if (patch.title !== undefined) values.name = patch.title;
  if (patch.note !== undefined) values.body = patch.note;
  if (patch.date !== undefined) values.date = toDate(patch.date);
  if (patch.link !== undefined) values.wikiUrl = patch.link;
  if (patch.sourceId !== undefined) values.workId = await workIdFor(userId, patch.sourceId);

  await db.transaction(async (tx) => {
    if (patch.kind !== undefined) values.kindId = await kindIdFor(tx, userId, patch.kind);

    if (Object.keys(values).length)
      await tx
        .update(fragments)
        .set(values)
        .where(and(eq(fragments.userId, userId), eq(fragments.id, id)));
    if (patch.keywords !== undefined) await setKeywords(tx, userId, id, splitLines(patch.keywords));
  });
}

export async function deleteWritingRow(userId: string, id: string): Promise<void> {
  await db.delete(fragments).where(and(eq(fragments.userId, userId), eq(fragments.id, id)));
}

/** 每次量測都是新的一列，不覆蓋舊的——累積起來就是成長曲線 */
export async function addMetricRow(userId: string, metric: Metric): Promise<void> {
  await db.insert(metrics).values({
    id: metric.id,
    userId,
    writingId: metric.writingId,
    date: metric.date,
    platform: metric.platform,
    views: Number(metric.views) || null,
    reads: Number(metric.reads) || null,
  });
}
