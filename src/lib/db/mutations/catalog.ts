import { and, eq } from "drizzle-orm";
import { fieldsOfModules } from "@/config/modules";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { recordKindFields, recordKinds, recordKindStatuses } from "@/lib/db/schema/kinds";
import { records, works } from "@/lib/db/schema/works";
import { toDate, toInt } from "./values";

/**
 * 照模組寫入。表單送來的是「欄位 → 值」，這裡決定進哪張表。
 *
 * 只寫這個類型勾了的欄位：沒勾的模組連空位都沒有，所以送進來也不收——
 * 客戶端不能繞過類型設定往資料表塞東西。
 */

export type FieldValues = Record<string, string>;

async function allowedFields(userId: string, kindId: string): Promise<Set<string>> {
  const rows = await db
    .select({ key: recordKindFields.fieldKey })
    .from(recordKindFields)
    .where(and(eq(recordKindFields.userId, userId), eq(recordKindFields.kindId, kindId)));
  return new Set(fieldsOfModules(rows.map((row) => row.key)));
}

const pick = (values: FieldValues, allowed: Set<string>, key: string) =>
  allowed.has(key) ? (values[key] ?? "") : "";

/** 新增一筆紀錄。作品與紀錄一起開——先有一次紀錄才有作品，反過來是空殼 */
export async function addRecord(
  userId: string,
  kindId: string,
  values: FieldValues,
): Promise<string> {
  const allowed = await allowedFields(userId, kindId);

  return db.transaction(async (tx) => {
    const [kind] = await tx
      .select({ amountUnit: recordKinds.amountUnit })
      .from(recordKinds)
      .where(and(eq(recordKinds.userId, userId), eq(recordKinds.id, kindId)));
    if (!kind) throw new Error("找不到這個類型");

    const [status] = await tx
      .select({ id: recordKindStatuses.id })
      .from(recordKindStatuses)
      .where(eq(recordKindStatuses.kindId, kindId))
      .orderBy(recordKindStatuses.sortOrder);
    if (!status) throw new Error("這個類型沒有狀態，不能新增紀錄");

    const [work] = await tx
      .insert(works)
      .values({
        userId,
        kindId,
        title: pick(values, allowed, "title"),
        creator: pick(values, allowed, "creator"),
        language: pick(values, allowed, "language"),
      })
      .returning({ id: works.id });

    const amount = toInt(pick(values, allowed, "amount"));
    const [record] = await tx
      .insert(records)
      .values({
        userId,
        workId: work.id,
        statusId: status.id,
        startDate: toDate(pick(values, allowed, "startDate")),
        endDate: toDate(pick(values, allowed, "endDate")),
        amount,
        amountUnit: amount === null ? "" : kind.amountUnit,
        source: pick(values, allowed, "source"),
        sourceUrl: pick(values, allowed, "sourceUrl"),
        coverUrl: pick(values, allowed, "coverUrl"),
        isPrivate: pick(values, allowed, "isPrivate") === "是",
      })
      .returning({ id: records.id });

    return record.id;
  });
}

/** 新增一則片段或專欄。兩者同一張表，差別只在類型屬於哪一堆 */
export async function addFragment(
  userId: string,
  kindId: string,
  values: FieldValues,
): Promise<string> {
  const allowed = await allowedFields(userId, kindId);

  const [row] = await db
    .insert(fragments)
    .values({
      userId,
      kindId,
      // 片段的標題欄叫 name，模組那層一律用 title
      name: pick(values, allowed, "title") || pick(values, allowed, "name"),
      body: pick(values, allowed, "body"),
      locator: pick(values, allowed, "locator"),
      translation: pick(values, allowed, "translation"),
      context: pick(values, allowed, "context"),
      contextTranslation: pick(values, allowed, "contextTranslation"),
      date: toDate(pick(values, allowed, "endDate")),
      wikiUrl: pick(values, allowed, "sourceUrl"),
    })
    .returning({ id: fragments.id });

  return row.id;
}
