import { and, eq, isNull } from "drizzle-orm";
import { db, type Tx } from "@/lib/db/client";
import { writingTopics } from "@/lib/db/schema/taxonomy";
import { records, works } from "@/lib/db/schema/works";
import { writings } from "@/lib/db/schema/writings";
import { splitLines } from "@/types/book";
import { Writing } from "@/types/writing";
import { setWritingSourceUrl } from "./external-links";
import { setKeywordLinks } from "./fragments";
import { unlinkAll } from "./internal-links";
import { kindIdByName } from "./kind-lookup";
import { toDate } from "./values";

/**
 * 書寫寫回 writings 表。
 *
 * 舊的 kind 欄混了出處與類型：「書籍」「文章」只是在說它有出處，那件事現在由
 * work_id 記；其餘的值才是真的類型。sourceId 進來的是「某一次讀」的編號，
 * 要換成它屬於哪個作品。
 *
 * 類型認不得就落到「書寫」——不在寫入時替使用者長出新類型，那是他在建立頁上
 * 決定的事。
 */

const SOURCE_KINDS = ["書籍", "文章"];
const FALLBACK_KIND = "書寫";

async function kindIdFor(tx: Tx, userId: string, kind: string): Promise<string> {
  const name = kind.trim();
  if (!name || SOURCE_KINDS.includes(name)) return kindIdByName(tx, userId, FALLBACK_KIND);
  try {
    return await kindIdByName(tx, userId, name);
  } catch {
    return kindIdByName(tx, userId, FALLBACK_KIND);
  }
}

/** 主題是扁平的一層，沒有領域那種父子結構；沒填就不掛 */
async function topicIdFor(tx: Tx, userId: string, topic: string): Promise<string | null> {
  const name = topic.trim();
  if (!name) return null;

  const [existing] = await tx
    .select({ id: writingTopics.id })
    .from(writingTopics)
    .where(
      and(
        eq(writingTopics.userId, userId),
        eq(writingTopics.name, name),
        isNull(writingTopics.parentId),
      ),
    );
  if (existing) return existing.id;

  const [row] = await tx
    .insert(writingTopics)
    .values({ userId, name })
    .returning({ id: writingTopics.id });
  return row.id;
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

export async function addWritingRow(userId: string, writing: Writing): Promise<void> {
  const workId = await workIdFor(userId, writing.sourceId);
  await db.transaction(async (tx) => {
    await tx.insert(writings).values({
      id: writing.id,
      userId,
      kindId: await kindIdFor(tx, userId, writing.kind),
      topicId: await topicIdFor(tx, userId, writing.topic),
      workId,
      name: writing.title,
      body: writing.note,
      date: toDate(writing.date),
      coverUrl: writing.coverUrl,
    });
    await setWritingSourceUrl(tx, userId, writing.id, writing.link);
    await setKeywordLinks(tx, userId, writing.id, splitLines(writing.keywords));
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
  if (patch.sourceId !== undefined) values.workId = await workIdFor(userId, patch.sourceId);
  if (patch.coverUrl !== undefined) values.coverUrl = patch.coverUrl;

  await db.transaction(async (tx) => {
    if (patch.kind !== undefined) values.kindId = await kindIdFor(tx, userId, patch.kind);
    if (patch.topic !== undefined) values.topicId = await topicIdFor(tx, userId, patch.topic);

    if (Object.keys(values).length)
      await tx
        .update(writings)
        .set(values)
        .where(and(eq(writings.userId, userId), eq(writings.id, id)));
    if (patch.link !== undefined) await setWritingSourceUrl(tx, userId, id, patch.link);
    if (patch.keywords !== undefined)
      await setKeywordLinks(tx, userId, id, splitLines(patch.keywords));
  });
}

export async function deleteWritingRow(userId: string, id: string): Promise<void> {
  await db.transaction(async (tx) => {
    // links_external 的 writing_id 是真正的外鍵，刪掉這筆連結會自動 cascade
    await tx.delete(writings).where(and(eq(writings.userId, userId), eq(writings.id, id)));
    await unlinkAll(tx, userId, id);
  });
}
