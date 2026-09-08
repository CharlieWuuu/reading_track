import { and, desc, eq } from "drizzle-orm";
import { DEFAULT_KINDS } from "@/config/default-kinds";
import { RECORD_FIELDS } from "@/config/record-fields";
import { KindGroup, KindSpec, NEW_KIND_STATUSES } from "@/config/record-kinds";
import { db, type Tx } from "@/lib/db/client";
import { recordKindFields, recordKinds, recordKindStatuses } from "@/lib/db/schema/kinds";

/**
 * 把預設類型灌進資料庫。
 *
 * 灌完就是一般的資料——改名、改欄位標籤、刪掉都行，spec 只是種子不是規則。
 * 已經有類型的人不再灌一次：判斷條件是「這個人有沒有任何類型」，不是逐一比對名字，
 * 不然使用者把「電影」刪掉，下次登入又長回來。
 */

async function insertKind(tx: Tx, userId: string, spec: KindSpec, sortOrder: number) {
  const [kind] = await tx
    .insert(recordKinds)
    .values({
      userId,
      groupKey: spec.group,
      name: spec.name,
      amountUnit: spec.amountUnit,
      sortOrder,
    })
    .returning({ id: recordKinds.id });

  // 顯示順序照欄位庫，不照 spec 裡寫的先後——不然改過名的欄位會擠到標題前面
  const fields = spec.fields.map((field) => ({
    userId,
    kindId: kind.id,
    fieldKey: field.key,
    label: field.label ?? "",
    isVisible: !field.hidden,
    sortOrder: RECORD_FIELDS.findIndex((f) => f.key === field.key),
  }));

  const statuses = spec.statuses.map((status, index) => ({
    userId,
    kindId: kind.id,
    key: status.key,
    label: status.label,
    sortOrder: index,
  }));

  await Promise.all([
    fields.length > 0 ? tx.insert(recordKindFields).values(fields) : undefined,
    statuses.length > 0 ? tx.insert(recordKindStatuses).values(statuses) : undefined,
  ]);
}

/**
 * 補上還沒有的預設類型。跟 seedKinds 的差別是它逐一比對名字——
 * 給改過規格的既有帳號用，不會動到已經在用的類型。
 */
export async function syncKinds(userId: string): Promise<string[]> {
  const existing = await db
    .select({ name: recordKinds.name })
    .from(recordKinds)
    .where(eq(recordKinds.userId, userId));
  const have = new Set(existing.map((k) => k.name));

  const missing = DEFAULT_KINDS.filter((spec) => !have.has(spec.name));
  await db.transaction(async (tx) => {
    for (const [index, spec] of missing.entries()) {
      await insertKind(tx, userId, spec, have.size + index);
    }
  });
  return missing.map((spec) => spec.name);
}

/** 回報灌了幾種；已經有資料就是 0 */
export async function seedKinds(userId: string): Promise<number> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: recordKinds.id })
      .from(recordKinds)
      .where(eq(recordKinds.userId, userId))
      .limit(1);
    if (existing) return 0;

    for (const [index, spec] of DEFAULT_KINDS.entries()) {
      await insertKind(tx, userId, spec, index);
    }
    return DEFAULT_KINDS.length;
  });
}

/**
 * 自己新增一種。欄位不用給——欄位庫是共用的，標籤沒改就用預設的。
 *
 * 排在同一堆的最後面。狀態選項也給一組預設的，沒有的話那一堆的紀錄就填不了狀態。
 */
export type NewKind = {
  name: string;
  /** 勾了哪些模組。空的就是全部給預設值 */
  modules?: string[];
  /** 量的單位：頁、分鐘、字 */
  amountUnit?: string;
};

export async function addKind(userId: string, group: KindGroup, kind: NewKind): Promise<string> {
  const { name, modules = [], amountUnit = "" } = kind;
  return db.transaction(async (tx) => {
    const [last] = await tx
      .select({ sortOrder: recordKinds.sortOrder })
      .from(recordKinds)
      .where(and(eq(recordKinds.userId, userId), eq(recordKinds.groupKey, group)))
      .orderBy(desc(recordKinds.sortOrder))
      .limit(1);

    const [created] = await tx
      .insert(recordKinds)
      .values({
        userId,
        groupKey: group,
        name,
        amountUnit,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      })
      .returning({ id: recordKinds.id });

    if (modules.length > 0) {
      await tx.insert(recordKindFields).values(
        modules.map((key, index) => ({
          userId,
          kindId: created.id,
          fieldKey: key,
          label: "",
          isVisible: true,
          sortOrder: index,
        })),
      );
    }

    if (group === "records") {
      await tx.insert(recordKindStatuses).values(
        NEW_KIND_STATUSES.map((status, index) => ({
          userId,
          kindId: created.id,
          key: status.key,
          label: status.label,
          sortOrder: index,
        })),
      );
    }
    return created.id;
  });
}
