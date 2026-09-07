import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recordKindFields, recordKinds, recordKindStatuses } from "@/lib/db/schema/kinds";
import { FieldOverride } from "@/utils/record-form";

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
  sortOrder: number;
  /** 交給 resolveFormFields，決定欄位在這個類型叫什麼 */
  fields: FieldOverride[];
  statuses: KindStatus[];
};

const groupBy = <T extends { kindId: string }>(rows: T[]): Map<string, T[]> =>
  rows.reduce((map, row) => {
    map.set(row.kindId, [...(map.get(row.kindId) ?? []), row]);
    return map;
  }, new Map<string, T[]>());

export async function listKinds(userId: string): Promise<Kind[]> {
  const [kinds, fields, statuses] = await Promise.all([
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
  ]);

  const fieldsByKind = groupBy(fields);
  const statusesByKind = groupBy(statuses);

  return kinds.map((kind) => ({
    id: kind.id,
    name: kind.name,
    sortOrder: kind.sortOrder,
    fields: (fieldsByKind.get(kind.id) ?? []).map((f) => ({
      key: f.fieldKey,
      label: f.label,
      hidden: !f.isVisible,
      sortOrder: f.sortOrder,
    })),
    statuses: (statusesByKind.get(kind.id) ?? []).map((s) => ({
      id: s.id,
      key: s.key,
      label: s.label,
    })),
  }));
}
