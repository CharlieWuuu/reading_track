import { and, asc, count, eq, isNull, or } from "drizzle-orm";
import { KindGroup } from "@/config/record-kinds";
import { db } from "@/lib/db/client";
import { fields as fieldsTable } from "@/lib/db/schema/fields";
import { fragments } from "@/lib/db/schema/fragments";
import { kinds as kindsTable, mapKindField } from "@/lib/db/schema/kinds";
import { records, works } from "@/lib/db/schema/works";
import { writings } from "@/lib/db/schema/writings";
import { ModuleOverride } from "@/utils/record-form";

/**
 * 類型連同它的欄位別名。
 *
 * 一次撈兩張表再在記憶體裡兜起來，不是每個類型各查一次——類型數量是個位數，
 * 但表單每開一次就要全部，N+1 沒有意義。
 */

export type Kind = {
  id: string;
  name: string;
  /** 網址上的那一段 */
  slug: string;
  /** 屬於側欄哪一堆 */
  group: KindGroup;
  sortOrder: number;
  amountUnit: string;
  /** 底下有幾筆。側欄用它決定要不要列 */
  count: number;
  /** 勾了哪些模組，以及它們在這個類型叫什麼。交給 resolveFormModules */
  modules: ModuleOverride[];
};

const groupBy = <T extends { kindId: string }>(rows: T[]): Map<string, T[]> =>
  rows.reduce((map, row) => {
    map.set(row.kindId, [...(map.get(row.kindId) ?? []), row]);
    return map;
  }, new Map<string, T[]>());

/**
 * 每一種底下有幾筆。側欄只列有資料的類型，沒用過的不佔位置。
 *
 * 書籍／文章這類要數 records（透過 join 換算回 kindId），不能直接數 works——
 * 一個作品可以有作品列卻沒有對應的閱讀紀錄（缺資料、匯入中斷……），
 * 這樣側欄跟列表頁（永遠是從 records 撈的）數字才會一致。
 */
async function countsByKind(userId: string): Promise<Map<string, number>> {
  const [workRows, fragmentRows, writingRows] = await Promise.all([
    db
      .select({ kindId: works.kindId, n: count() })
      .from(records)
      .innerJoin(works, eq(works.id, records.workId))
      .where(eq(records.userId, userId))
      .groupBy(works.kindId),
    db
      .select({ kindId: fragments.kindId, n: count() })
      .from(fragments)
      .where(eq(fragments.userId, userId))
      .groupBy(fragments.kindId),
    db
      .select({ kindId: writings.kindId, n: count() })
      .from(writings)
      .where(eq(writings.userId, userId))
      .groupBy(writings.kindId),
  ]);

  const map = new Map<string, number>();
  for (const row of [...workRows, ...fragmentRows, ...writingRows]) {
    map.set(row.kindId, (map.get(row.kindId) ?? 0) + row.n);
  }
  return map;
}

export async function listKinds(userId: string): Promise<Kind[]> {
  const [kinds, fieldLinks, counts] = await Promise.all([
    db
      .select()
      .from(kindsTable)
      .where(or(eq(kindsTable.userId, userId), isNull(kindsTable.userId)))
      .orderBy(asc(kindsTable.sortOrder), asc(kindsTable.name)),
    db
      .select({
        kindId: mapKindField.kindId,
        fieldKey: mapKindField.fieldKey,
        label: fieldsTable.label,
        isVisible: mapKindField.isVisible,
        sortOrder: mapKindField.sortOrder,
      })
      .from(mapKindField)
      .innerJoin(fieldsTable, eq(fieldsTable.id, mapKindField.fieldId))
      .where(or(eq(mapKindField.userId, userId), isNull(mapKindField.userId)))
      .orderBy(asc(mapKindField.sortOrder)),
    countsByKind(userId),
  ]);

  const fieldsByKind = groupBy(fieldLinks);

  return kinds.map((kind) => ({
    id: kind.id,
    name: kind.name,
    slug: kind.slug,
    group: kind.groupKey as KindGroup,
    amountUnit: kind.amountUnit,
    count: counts.get(kind.id) ?? 0,
    sortOrder: kind.sortOrder,
    modules: (fieldsByKind.get(kind.id) ?? [])
      .filter((f) => f.isVisible)
      .map((f) => ({ key: f.fieldKey, label: f.label, sortOrder: f.sortOrder })),
  }));
}

/** 這個 slug 在這一堆底下是不是已經被占走了，給新增表單即時檢查用 */
export async function slugTaken(userId: string, group: KindGroup, slug: string): Promise<boolean> {
  const [row] = await db
    .select({ id: kindsTable.id })
    .from(kindsTable)
    .where(
      and(
        or(eq(kindsTable.userId, userId), isNull(kindsTable.userId)),
        eq(kindsTable.groupKey, group),
        eq(kindsTable.slug, slug),
      ),
    );
  return Boolean(row);
}

/** 這個類型屬於哪一堆。寫入時要靠它決定進哪張表 */
export async function kindGroupOf(userId: string, kindId: string): Promise<KindGroup | null> {
  const [row] = await db
    .select({ group: kindsTable.groupKey })
    .from(kindsTable)
    .where(
      and(or(eq(kindsTable.userId, userId), isNull(kindsTable.userId)), eq(kindsTable.id, kindId)),
    );
  return (row?.group as KindGroup) ?? null;
}
