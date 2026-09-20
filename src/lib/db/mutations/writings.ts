import { randomUUID } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, type Tx } from "@/lib/db/client";
import { kinds } from "@/lib/db/schema/kinds";
import { records, works } from "@/lib/db/schema/works";
import { writings } from "@/lib/db/schema/writings";
import { splitLines } from "@/types/book";
import { Writing } from "@/types/writing";
import { linkedIdsOf } from "../queries/internal-links";
import { assertKindGroup } from "./assert-group";
import { allowedFields } from "./catalog";
import { setWritingSourceUrl } from "./external-links";
import { setKeywordLinks } from "./fragments";
import { link, unlink, unlinkAll } from "./internal-links";
import { insertValues, taxonomyValues } from "./module-values";
import { toDate } from "./values";

/**
 * 書寫寫回 writings 表。
 *
 * 心得、思緒、週計劃是第三層類型，跟書籍、文章同一個位階——不再是主題。
 * 舊形狀的 topic 欄帶的就是類型名字，寫入時換成 kind_id。
 *
 * sourceId 進來的是「某一次讀」的編號，要換成它屬於哪個作品。
 */

/** 沒指定類型時的預設，一則書寫一定要掛一個類型 */
const FALLBACK_KIND = "心得";

/** 舊形狀帶名字，這裡換成編號。名字使用者改得掉，所以找不到就丟錯不亂猜 */
async function writingKindIdFor(tx: Tx, userId: string, topic: string): Promise<string> {
  const name = topic.trim() || FALLBACK_KIND;
  const [kind] = await tx
    .select({ id: kinds.id })
    .from(kinds)
    .where(and(eq(kinds.userId, userId), eq(kinds.groupKey, "writings"), eq(kinds.name, name)));
  if (!kind) throw new Error(`書寫底下沒有「${name}」這個類型`);
  return kind.id;
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

/**
 * 出處落在 links_internal，不是 writings 自己的欄位。
 *
 * 舊形狀一則書寫只有一個出處，所以先拆掉既有的作品關聯再連新的——
 * 關鍵字那些片段關聯不能動，它們跟出處同住一張表。
 */
async function setSourceWork(
  tx: Tx,
  userId: string,
  writingId: string,
  workId: string | null,
): Promise<void> {
  const linkedIds = await linkedIdsOf(userId, writingId, tx);
  if (linkedIds.length) {
    const linkedWorks = await tx
      .select({ id: works.id })
      .from(works)
      .where(and(eq(works.userId, userId), inArray(works.id, linkedIds)));
    for (const work of linkedWorks) await unlink(tx, userId, writingId, work.id);
  }
  if (workId) await link(tx, userId, writingId, workId);
}

export async function addWritingRow(userId: string, writing: Writing): Promise<void> {
  const workId = await workIdFor(userId, writing.sourceId);
  await db.transaction(async (tx) => {
    await tx.insert(writings).values({
      id: writing.id,
      userId,
      kindId: await writingKindIdFor(tx, userId, writing.topic),
      title: writing.title,
      body: writing.note,
      endDate: toDate(writing.endDate),
    });
    await setSourceWork(tx, userId, writing.id, workId);
    await setWritingSourceUrl(tx, userId, writing.id, writing.link);
    await setKeywordLinks(tx, userId, writing.id, splitLines(writing.keywords));
  });
}

/**
 * 從通用表單新增一則書寫。kindId 是現成的，不用像 addWritingRow 那樣靠 topic 反查。
 *
 * 沒有字數：那是內文本身算得出來的，不存。
 */
export async function addWritingFromValues(
  userId: string,
  kindId: string,
  values: Record<string, string>,
): Promise<string> {
  await assertKindGroup(kindId, "writings");
  // id 自己產：這張表的欄位沒有 default，靠資料庫給會撞 not-null（舊的 addWritingRow 也是自己帶）
  const id = randomUUID();
  const allowed = await allowedFields(userId, kindId);
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(writings)
      .values({
        id,
        userId,
        kindId,
        ...insertValues(values, allowed),
        ...(await taxonomyValues(tx, userId, values, allowed)),
      })
      .returning({ id: writings.id });
    return row.id;
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
  if (patch.title !== undefined) values.title = patch.title;
  if (patch.note !== undefined) values.body = patch.note;
  if (patch.endDate !== undefined) values.endDate = toDate(patch.endDate);
  const workId = patch.sourceId === undefined ? undefined : await workIdFor(userId, patch.sourceId);

  await db.transaction(async (tx) => {
    if (patch.topic !== undefined) values.kindId = await writingKindIdFor(tx, userId, patch.topic);

    if (Object.keys(values).length)
      await tx
        .update(writings)
        .set(values)
        .where(and(eq(writings.userId, userId), eq(writings.id, id)));
    if (workId !== undefined) await setSourceWork(tx, userId, id, workId);
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
