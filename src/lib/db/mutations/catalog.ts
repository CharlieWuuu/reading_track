import { and, eq } from "drizzle-orm";
import { fieldsOfModules } from "@/config/modules";
import { db } from "@/lib/db/client";
import { mapKindField } from "@/lib/db/schema/kinds";
import { records, works } from "@/lib/db/schema/works";
import { setRecordSourceUrl } from "./external-links";
import { toDate, toInt } from "./values";

/**
 * 照模組寫入。表單送來的是「欄位 → 值」，這裡決定進哪張表。
 *
 * 只寫這個類型勾了的欄位：沒勾的模組連空位都沒有，所以送進來也不收——
 * 客戶端不能繞過類型設定往資料表塞東西。
 */

export type FieldValues = Record<string, string>;

export async function allowedFields(userId: string, kindId: string): Promise<Set<string>> {
  const rows = await db
    .select({ key: mapKindField.fieldKey })
    .from(mapKindField)
    .where(and(eq(mapKindField.userId, userId), eq(mapKindField.kindId, kindId)));
  return new Set(fieldsOfModules(rows.map((row) => row.key)));
}

export const pick = (values: FieldValues, allowed: Set<string>, key: string) =>
  allowed.has(key) ? (values[key] ?? "") : "";

/** 新增一筆紀錄。作品與紀錄一起開——先有一次紀錄才有作品，反過來是空殼 */
export async function addRecord(
  userId: string,
  kindId: string,
  values: FieldValues,
): Promise<string> {
  const allowed = await allowedFields(userId, kindId);

  return db.transaction(async (tx) => {
    const [work] = await tx
      .insert(works)
      .values({
        userId,
        kindId,
        title: pick(values, allowed, "title"),
        creator: pick(values, allowed, "creator"),
        language: pick(values, allowed, "language"),
        source: pick(values, allowed, "source"),
        externalId: pick(values, allowed, "externalId"),
        coverUrl: pick(values, allowed, "coverUrl"),
      })
      .returning({ id: works.id });

    const amount = toInt(pick(values, allowed, "amount"));
    const [record] = await tx
      .insert(records)
      .values({
        userId,
        workId: work.id,
        startDate: toDate(pick(values, allowed, "startDate")),
        endDate: toDate(pick(values, allowed, "endDate")),
        amount,
        isPrivate: pick(values, allowed, "isPrivate") === "是",
      })
      .returning({ id: records.id });

    await setRecordSourceUrl(tx, userId, record.id, pick(values, allowed, "sourceUrl"));

    return record.id;
  });
}

/** 改一筆紀錄。只動勾了的欄位，作品層與紀錄層分開更新 */
export async function updateRecord(userId: string, id: string, values: FieldValues): Promise<void> {
  const [target] = await db
    .select({ workId: records.workId, kindId: works.kindId })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .where(and(eq(records.userId, userId), eq(records.id, id)));
  if (!target) throw new Error("找不到這一筆");

  const allowed = await allowedFields(userId, target.kindId);
  const has = (key: string) => allowed.has(key) && values[key] !== undefined;

  const workPatch: Record<string, unknown> = {};
  if (has("title")) workPatch.title = values.title;
  if (has("creator")) workPatch.creator = values.creator;
  if (has("language")) workPatch.language = values.language;
  if (has("source")) workPatch.source = values.source;
  if (has("externalId")) workPatch.externalId = values.externalId;
  if (has("coverUrl")) workPatch.coverUrl = values.coverUrl;

  const recordPatch: Record<string, unknown> = {};
  if (has("startDate")) recordPatch.startDate = toDate(values.startDate);
  if (has("endDate")) recordPatch.endDate = toDate(values.endDate);
  if (has("isPrivate")) recordPatch.isPrivate = values.isPrivate === "是";
  if (has("amount")) recordPatch.amount = toInt(values.amount);

  await db.transaction(async (tx) => {
    if (Object.keys(workPatch).length)
      await tx.update(works).set(workPatch).where(eq(works.id, target.workId));
    if (Object.keys(recordPatch).length)
      await tx.update(records).set(recordPatch).where(eq(records.id, id));
    if (has("sourceUrl")) await setRecordSourceUrl(tx, userId, id, values.sourceUrl);
  });
}

/** 刪掉最後一筆紀錄時，那個作品也沒有存在的意義了 */
export async function deleteRecord(userId: string, id: string): Promise<void> {
  const [target] = await db
    .select({ workId: records.workId })
    .from(records)
    .where(and(eq(records.userId, userId), eq(records.id, id)));
  if (!target) return;

  await db.transaction(async (tx) => {
    await tx.delete(records).where(and(eq(records.userId, userId), eq(records.id, id)));
    const rest = await tx
      .select({ id: records.id })
      .from(records)
      .where(eq(records.workId, target.workId));
    if (rest.length === 0) await tx.delete(works).where(eq(works.id, target.workId));
  });
}
