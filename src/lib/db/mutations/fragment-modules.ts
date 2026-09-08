import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { allowedFields, FieldValues, pick } from "./catalog";
import { toDate } from "./values";

/**
 * 片段與專欄照模組寫入。兩者同一張表，差別只在類型屬於哪一堆。
 *
 * 欄位名跟紀錄那邊不一樣（標題叫 name、連結叫 wiki_url），換算只在這一層做——
 * 模組那層一律用 title、sourceUrl。
 */

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

  const patch: Record<string, unknown> = {};
  if (has("title")) patch.name = values.title;
  if (has("body")) patch.body = values.body;
  if (has("locator")) patch.locator = values.locator;
  if (has("translation")) patch.translation = values.translation;
  if (has("context")) patch.context = values.context;
  if (has("contextTranslation")) patch.contextTranslation = values.contextTranslation;
  if (has("endDate")) patch.date = toDate(values.endDate);
  if (has("sourceUrl")) patch.wikiUrl = values.sourceUrl;

  if (Object.keys(patch).length)
    await db
      .update(fragments)
      .set(patch)
      .where(and(eq(fragments.userId, userId), eq(fragments.id, id)));
}

export async function deleteFragment(userId: string, id: string): Promise<void> {
  await db.delete(fragments).where(and(eq(fragments.userId, userId), eq(fragments.id, id)));
}
