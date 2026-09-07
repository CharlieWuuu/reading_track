import { eq } from "drizzle-orm";
import { DEFAULT_KINDS } from "@/config/default-kinds";
import { RECORD_FIELDS } from "@/config/record-fields";
import { KindSpec } from "@/config/record-kinds";
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
    .values({ userId, groupKey: spec.group, name: spec.name, sortOrder })
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
