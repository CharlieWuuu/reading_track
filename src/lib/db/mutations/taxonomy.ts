import { and, eq, isNull } from "drizzle-orm";
import { db, type Tx } from "@/lib/db/client";
import { attributes, bookTypes, writingTypes } from "@/lib/db/schema/taxonomy";
import { splitLines } from "@/types/book";

/**
 * 分類的值就是「我實際用過的」，沒有一份要維護的清單——Sheet 時代就是這樣，
 * 換成資料表之後靠 upsert 維持同一個規則：填了新的值就自己長出一個節點。
 *
 * 這幾支只在交易裡被呼叫，所以一律收 tx；用外層的 db 會跑在交易外面。
 */

async function upsertType(
  tx: Tx,
  userId: string,
  name: string,
  parentId: string | null,
): Promise<string> {
  const [existing] = await tx
    .select({ id: bookTypes.id })
    .from(bookTypes)
    .where(
      and(
        eq(bookTypes.userId, userId),
        eq(bookTypes.name, name),
        parentId ? eq(bookTypes.parentId, parentId) : isNull(bookTypes.parentId),
      ),
    );
  if (existing) return existing.id;

  const [row] = await tx
    .insert(bookTypes)
    .values({ userId, name, parentId })
    .returning({ id: bookTypes.id });
  return row.id;
}

/** 領域是父節點、次領域是它的子節點；只填領域就掛在領域本身 */
export async function typeIdFor(
  tx: Tx,
  userId: string,
  domain: string,
  subDomain: string,
): Promise<string | null> {
  const parentName = domain.trim();
  if (!parentName) return null;

  const parentId = await upsertType(tx, userId, parentName, null);
  const childName = subDomain.trim();
  return childName ? upsertType(tx, userId, childName, parentId) : parentId;
}

/** 屬性改成單選了，舊資料若還帶著多行就取第一個 */
export async function attributeIdFor(
  tx: Tx,
  userId: string,
  value: string,
): Promise<string | null> {
  const name = splitLines(value)[0]?.trim();
  if (!name) return null;

  const [row] = await tx
    .insert(attributes)
    .values({ userId, name })
    .onConflictDoUpdate({ target: [attributes.userId, attributes.name], set: { name } })
    .returning({ id: attributes.id });
  return row.id;
}

/**
 * 標記／取消私人。兩種各有一張表，但畫面上是同一件事，所以收成一支。
 *
 * 不進交易：一次只改一列，而且它不牽動別的表——類型底下的子類型會跟著藏，
 * 那是讀取時沿樹走出來的（見 queries/settings 的 privateTypeNames），
 * 不是把旗標抄下去。
 */
export type PrivacyTarget = "type" | "writingType";

export async function setPrivacyFlag(
  userId: string,
  target: PrivacyTarget,
  id: string,
  isPrivate: boolean,
): Promise<void> {
  // 帶 userId 的 where：別人的節點編號猜到了也改不動
  if (target === "type") {
    await db
      .update(bookTypes)
      .set({ isPrivate })
      .where(and(eq(bookTypes.userId, userId), eq(bookTypes.id, id)));
    return;
  }
  await db
    .update(writingTypes)
    .set({ isPrivate })
    .where(and(eq(writingTypes.userId, userId), eq(writingTypes.id, id)));
}
