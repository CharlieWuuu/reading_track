import { and, desc, eq, isNull, or } from "drizzle-orm";
import { KindTemplate } from "@/config/kind-templates";
import { moduleDef } from "@/config/modules";
import { KindGroup } from "@/config/record-kinds";
import { db, type Tx } from "@/lib/db/client";
import { fields } from "@/lib/db/schema/fields";
import { kinds, mapKindField } from "@/lib/db/schema/kinds";

/**
 * 類型的寫入。
 *
 * 範本是常駐的：使用者把「書籍」刪掉，是他那份資料沒了，範本還在範本庫裡，
 * 隨時能再套一次。所以這裡不做「補回缺少的預設類型」那種事——刪掉就是刪掉。
 */

export type NewKind = {
  name: string;
  /** 勾了哪些模組 */
  modules: string[];
  amountUnit: string;
  /** 模組在這個類型叫什麼 */
  labels?: Record<string, string>;
};

/**
 * label 一定要有值：沒自訂就用模組庫的預設名稱，field_id 才不會是空的。
 * fields 全體共用，不分使用者。
 */
async function fieldIdFor(tx: Tx, fieldKey: string, label: string): Promise<string> {
  const [existing] = await tx
    .select({ id: fields.id })
    .from(fields)
    .where(and(eq(fields.fieldKey, fieldKey), eq(fields.label, label)));
  if (existing) return existing.id;

  const [row] = await tx.insert(fields).values({ fieldKey, label }).returning({ id: fields.id });
  return row.id;
}

async function insertKind(
  tx: Tx,
  userId: string,
  group: KindGroup,
  kind: NewKind,
  sortOrder: number,
): Promise<string> {
  const [created] = await tx
    .insert(kinds)
    .values({
      userId,
      groupKey: group,
      name: kind.name,
      amountUnit: kind.amountUnit,
      sortOrder,
    })
    .returning({ id: kinds.id });

  // 認不得的模組丟掉：客戶端不能往資料庫塞任意字串
  const modules = kind.modules.filter((key) => moduleDef(key));
  if (modules.length > 0) {
    const rows = await Promise.all(
      modules.map(async (key, index) => ({
        userId,
        kindId: created.id,
        fieldKey: key,
        fieldId: await fieldIdFor(tx, key, kind.labels?.[key] || moduleDef(key)!.label),
        isVisible: true,
        sortOrder: index,
      })),
    );
    await tx.insert(mapKindField).values(rows);
  }

  return created.id;
}

const fromTemplate = (template: KindTemplate): NewKind => ({
  name: template.name,
  modules: [...template.modules],
  amountUnit: template.amountUnit,
  labels: template.labels,
});

/** 排在同一堆的最後面，含系統預設的類型一起排 */
async function nextSortOrder(tx: Tx, userId: string, group: KindGroup): Promise<number> {
  const [last] = await tx
    .select({ sortOrder: kinds.sortOrder })
    .from(kinds)
    .where(and(or(eq(kinds.userId, userId), isNull(kinds.userId)), eq(kinds.groupKey, group)))
    .orderBy(desc(kinds.sortOrder))
    .limit(1);
  return (last?.sortOrder ?? -1) + 1;
}

export async function addKind(userId: string, group: KindGroup, kind: NewKind): Promise<string> {
  return db.transaction(async (tx) =>
    insertKind(tx, userId, group, kind, await nextSortOrder(tx, userId, group)),
  );
}

/** 套一份範本。跟自己勾的走同一條路，套完就是他的了 */
export async function addKindFromTemplate(userId: string, template: KindTemplate): Promise<string> {
  return addKind(userId, template.group, fromTemplate(template));
}

/**
 * 開帳號時先給的那幾種。書籍、文章、佳句、單字、關鍵字、書寫這六種現在是
 * 系統共用的（user_id 是 NULL），全體使用者本來就看得到，不用再各自建一份——
 * 所以這支現在什麼都不用做，留著只是呼叫端還在用，回傳 0 代表沒新增任何東西。
 */
export async function seedKinds(_userId: string): Promise<number> {
  return 0;
}
