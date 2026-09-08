import { asc, count, eq } from "drizzle-orm";
import { KindGroup } from "@/config/record-kinds";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { recordKindFields, recordKinds, recordKindStatuses } from "@/lib/db/schema/kinds";
import { works } from "@/lib/db/schema/works";
import { ModuleOverride } from "@/utils/record-form";

/**
 * 類型連同它的欄位別名與狀態選項。
 *
 * 一次撈三張表再在記憶體裡兜起來，不是每個類型各查一次——類型數量是個位數，
 * 但表單每開一次就要全部，N+1 沒有意義。
 */

export type KindStatus = { id: string; key: string; label: string };

export type Kind = {
  id: string;
  name: string;
  /** 屬於側欄哪一堆 */
  group: KindGroup;
  sortOrder: number;
  amountUnit: string;
  /** 底下有幾筆。側欄用它決定要不要列 */
  count: number;
  /** 勾了哪些模組，以及它們在這個類型叫什麼。交給 resolveFormModules */
  modules: ModuleOverride[];
  statuses: KindStatus[];
};

const groupBy = <T extends { kindId: string }>(rows: T[]): Map<string, T[]> =>
  rows.reduce((map, row) => {
    map.set(row.kindId, [...(map.get(row.kindId) ?? []), row]);
    return map;
  }, new Map<string, T[]>());

/** 每一種底下有幾筆。側欄只列有資料的類型，沒用過的不佔位置 */
async function countsByKind(userId: string): Promise<Map<string, number>> {
  const [workRows, fragmentRows] = await Promise.all([
    db
      .select({ kindId: works.kindId, n: count() })
      .from(works)
      .where(eq(works.userId, userId))
      .groupBy(works.kindId),
    db
      .select({ kindId: fragments.kindId, n: count() })
      .from(fragments)
      .where(eq(fragments.userId, userId))
      .groupBy(fragments.kindId),
  ]);

  const map = new Map<string, number>();
  for (const row of [...workRows, ...fragmentRows]) {
    map.set(row.kindId, (map.get(row.kindId) ?? 0) + row.n);
  }
  return map;
}

export async function listKinds(userId: string): Promise<Kind[]> {
  const [kinds, fields, statuses, counts] = await Promise.all([
    db
      .select()
      .from(recordKinds)
      .where(eq(recordKinds.userId, userId))
      .orderBy(asc(recordKinds.sortOrder), asc(recordKinds.name)),
    db
      .select()
      .from(recordKindFields)
      .where(eq(recordKindFields.userId, userId))
      .orderBy(asc(recordKindFields.sortOrder)),
    db
      .select()
      .from(recordKindStatuses)
      .where(eq(recordKindStatuses.userId, userId))
      .orderBy(asc(recordKindStatuses.sortOrder)),
    countsByKind(userId),
  ]);

  const fieldsByKind = groupBy(fields);
  const statusesByKind = groupBy(statuses);

  return kinds.map((kind) => ({
    id: kind.id,
    name: kind.name,
    group: kind.groupKey as KindGroup,
    amountUnit: kind.amountUnit,
    count: counts.get(kind.id) ?? 0,
    sortOrder: kind.sortOrder,
    modules: (fieldsByKind.get(kind.id) ?? [])
      .filter((f) => f.isVisible)
      .map((f) => ({ key: f.fieldKey, label: f.label, sortOrder: f.sortOrder })),
    statuses: (statusesByKind.get(kind.id) ?? []).map((s) => ({
      id: s.id,
      key: s.key,
      label: s.label,
    })),
  }));
}
