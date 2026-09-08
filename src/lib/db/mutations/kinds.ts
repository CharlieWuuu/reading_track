import { and, desc, eq } from "drizzle-orm";
import { KIND_TEMPLATES, KindTemplate, STARTER_KEYS } from "@/config/kind-templates";
import { moduleDef } from "@/config/modules";
import { KindGroup, NEW_KIND_STATUSES } from "@/config/record-kinds";
import { db, type Tx } from "@/lib/db/client";
import { recordKindFields, recordKinds, recordKindStatuses } from "@/lib/db/schema/kinds";

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

async function insertKind(
  tx: Tx,
  userId: string,
  group: KindGroup,
  kind: NewKind,
  sortOrder: number,
): Promise<string> {
  const [created] = await tx
    .insert(recordKinds)
    .values({
      userId,
      groupKey: group,
      name: kind.name,
      amountUnit: kind.amountUnit,
      sortOrder,
    })
    .returning({ id: recordKinds.id });

  // 認不得的模組丟掉：客戶端不能往資料庫塞任意字串
  const modules = kind.modules.filter((key) => moduleDef(key));
  if (modules.length > 0) {
    await tx.insert(recordKindFields).values(
      modules.map((key, index) => ({
        userId,
        kindId: created.id,
        fieldKey: key,
        label: kind.labels?.[key] ?? "",
        isVisible: true,
        sortOrder: index,
      })),
    );
  }

  // 只有紀錄那一堆有進度：一句佳句摘下來就是摘下來了，沒有「在讀」
  if (group === "records" && modules.includes("progress")) {
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
}

const fromTemplate = (template: KindTemplate): NewKind => ({
  name: template.name,
  modules: [...template.modules],
  amountUnit: template.amountUnit,
  labels: template.labels,
});

/** 排在同一堆的最後面 */
async function nextSortOrder(tx: Tx, userId: string, group: KindGroup): Promise<number> {
  const [last] = await tx
    .select({ sortOrder: recordKinds.sortOrder })
    .from(recordKinds)
    .where(and(eq(recordKinds.userId, userId), eq(recordKinds.groupKey, group)))
    .orderBy(desc(recordKinds.sortOrder))
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
 * 開帳號時先給的那幾種。判斷條件是「這個人有沒有任何類型」而不是逐一比對名字——
 * 刪掉「電影」下次登入就不該長回來。
 */
export async function seedKinds(userId: string): Promise<number> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: recordKinds.id })
      .from(recordKinds)
      .where(eq(recordKinds.userId, userId))
      .limit(1);
    if (existing) return 0;

    const starters = KIND_TEMPLATES.filter((template) => STARTER_KEYS.has(template.key));
    const counters = new Map<KindGroup, number>();

    for (const template of starters) {
      const order = counters.get(template.group) ?? 0;
      counters.set(template.group, order + 1);
      await insertKind(tx, userId, template.group, fromTemplate(template), order);
    }
    return starters.length;
  });
}
