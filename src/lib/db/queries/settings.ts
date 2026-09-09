import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recordTopics, settings } from "@/lib/db/schema/taxonomy";

/**
 * 設定與私人清單。
 *
 * Sheet 時代「私人類型」「私人屬性」是設定分頁上的多值列；現在旗標直接掛在
 * 類型與關鍵字自己身上——想藏「政治」就標那個節點，不用另外維護一份清單。
 */

export async function readSetting(userId: string, key: string): Promise<string> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(and(eq(settings.userId, userId), eq(settings.key, key)));
  return row?.value ?? "";
}

/** 值是空字串就把那一列刪掉，表上不留空設定 */
export async function writeSetting(userId: string, key: string, value: string): Promise<void> {
  if (!value) {
    await db.delete(settings).where(and(eq(settings.userId, userId), eq(settings.key, key)));
    return;
  }
  await db
    .insert(settings)
    .values({ userId, key, value })
    .onConflictDoUpdate({ target: [settings.userId, settings.key], set: { value } });
}

/** 標了私人的主題，連同它底下的子節點——標「政治」就等於標了它的每一個分支 */
async function privateTypeNames(userId: string): Promise<string[]> {
  const rows = await db
    .select({
      id: recordTopics.id,
      name: recordTopics.name,
      parentId: recordTopics.parentId,
      isPrivate: recordTopics.isPrivate,
    })
    .from(recordTopics)
    .where(eq(recordTopics.userId, userId));

  const byParent = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!row.parentId) continue;
    byParent.set(row.parentId, [...(byParent.get(row.parentId) ?? []), row]);
  }

  const names: string[] = [];
  const walk = (id: string, name: string) => {
    names.push(name);
    for (const child of byParent.get(id) ?? []) walk(child.id, child.name);
  };
  for (const row of rows) if (row.isPrivate) walk(row.id, row.name);
  return names;
}

export interface PrivacySettings {
  stored: string;
  privateTypes: string[];
}

export async function readPrivacySettings(
  userId: string,
  passcodeKey: string,
): Promise<PrivacySettings> {
  const [stored, types] = await Promise.all([
    readSetting(userId, passcodeKey),
    privateTypeNames(userId),
  ]);

  return { stored, privateTypes: types };
}
