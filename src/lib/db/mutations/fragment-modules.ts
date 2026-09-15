import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { allowedFields, FieldValues, pick } from "./catalog";
import { setFragmentSourceUrl } from "./external-links";
import { toDate, toFloat, toYear } from "./values";

/**
 * 片段與書寫照模組寫入。兩者同一張表，差別只在類型屬於哪個 group。
 *
 * 欄位名跟紀錄那邊不一樣（標題叫 name、連結走 external_links），換算只在這一層做——
 * 模組那層一律用 title、externalUrl。
 */

/** 新增一則片段或書寫。兩者同一張表，差別只在類型屬於哪個 group */
export async function addFragment(
  userId: string,
  kindId: string,
  values: FieldValues,
): Promise<string> {
  const allowed = await allowedFields(userId, kindId);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(fragments)
      .values({
        userId,
        kindId,
        // 片段的標題欄叫 name，模組那層一律用 title
        title: pick(values, allowed, "title"),
        body: pick(values, allowed, "body"),
        locator: pick(values, allowed, "locator"),
        translation: pick(values, allowed, "translation"),
        context: pick(values, allowed, "context"),
        contextTranslation: pick(values, allowed, "contextTranslation"),
        tags: pick(values, allowed, "tags"),
        startYear: toYear(pick(values, allowed, "startYear")),
        endYear: toYear(pick(values, allowed, "endYear")),
        latitude: toFloat(pick(values, allowed, "latitude")),
        longitude: toFloat(pick(values, allowed, "longitude")),
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

  const patch: Record<string, unknown> = {};
  if (has("title")) patch.title = values.title;
  if (has("body")) patch.body = values.body;
  if (has("locator")) patch.locator = values.locator;
  if (has("translation")) patch.translation = values.translation;
  if (has("context")) patch.context = values.context;
  if (has("contextTranslation")) patch.contextTranslation = values.contextTranslation;
  if (has("tags")) patch.tags = values.tags;
  if (has("startYear")) patch.startYear = toYear(values.startYear);
  if (has("endYear")) patch.endYear = toYear(values.endYear);
  if (has("latitude")) patch.latitude = toFloat(values.latitude);
  if (has("longitude")) patch.longitude = toFloat(values.longitude);
  if (has("endDate")) patch.date = toDate(values.endDate);

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
