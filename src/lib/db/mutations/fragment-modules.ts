import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { assertKindGroup } from "./assert-group";
import { allowedFields, FieldValues, pick } from "./catalog";
import { setFragmentSourceUrl } from "./external-links";
import { insertValues, updateValues } from "./module-values";

/**
 * 片段照模組寫入。書寫早就獨立成 domain_writings，不在這裡。
 *
 * 欄位名跟紀錄那邊不一樣（標題叫 name、連結走 external_links），換算只在這一層做——
 * 模組那層一律用 title、externalUrl。
 */

/** 新增一則片段。書寫早就獨立成 domain_writings，走 addWritingFromValues */
export async function addFragment(
  userId: string,
  kindId: string,
  values: FieldValues,
): Promise<string> {
  await assertKindGroup(kindId, "fragments");
  const allowed = await allowedFields(userId, kindId);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(fragments)
      .values({
        userId,
        kindId,
        ...insertValues(values, allowed),
      })
      .returning({ id: fragments.id });

    await setFragmentSourceUrl(tx, userId, row.id, pick(values, allowed, "externalUrl"));

    return row.id;
  });
}

export async function updateFragment(
  userId: string,
  id: string,
  values: FieldValues,
): Promise<void> {
  const [target] = await db
    .select({ kindId: fragments.kindId })
    .from(fragments)
    .where(and(eq(fragments.userId, userId), eq(fragments.id, id)));
  if (!target) throw new Error("找不到這一筆");

  const allowed = await allowedFields(userId, target.kindId);
  const has = (key: string) => allowed.has(key) && values[key] !== undefined;

  const patch = updateValues(values, allowed);

  await db.transaction(async (tx) => {
    if (Object.keys(patch).length)
      await tx
        .update(fragments)
        .set(patch)
        .where(and(eq(fragments.userId, userId), eq(fragments.id, id)));
    if (has("externalUrl")) await setFragmentSourceUrl(tx, userId, id, values.externalUrl);
  });
}

export async function deleteFragment(userId: string, id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(fragments).where(and(eq(fragments.userId, userId), eq(fragments.id, id)));
    // external_links 的 source_id 不是外鍵（要同時指兩張表），fragment 刪掉不會自動 cascade
    await setFragmentSourceUrl(tx, userId, id, "");
  });
}
