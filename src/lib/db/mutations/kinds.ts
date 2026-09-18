import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { KindTemplate, STARTER_KEYS } from "@/config/kind-templates";
import { moduleDef } from "@/config/modules";
import { KindGroup } from "@/config/record-kinds";
import { db, type Tx } from "@/lib/db/client";
import { fields } from "@/lib/db/schema/fields";
import { fragments } from "@/lib/db/schema/fragments";
import { kinds, mapKindField, userKinds } from "@/lib/db/schema/kinds";
import { works } from "@/lib/db/schema/works";
import { writings } from "@/lib/db/schema/writings";

/**
 * 類型的寫入。
 *
 * 範本是常駐的：使用者把「書籍」刪掉，是他那份資料沒了，範本還在範本庫裡，
 * 隨時能再套一次。所以這裡不做「補回缺少的預設類型」那種事——刪掉就是刪掉。
 */

export type NewKind = {
  name: string;
  /** 網址上的那一段，人工填、英文小寫連字號 */
  slug: string;
  /** 勾了哪些模組 */
  modules: string[];
  amountUnit: string;
  /** 自己沒封面時要不要用連到的作品的封面 */
  inheritsCover: boolean;
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
      slug: kind.slug,
      amountUnit: kind.amountUnit,
      inheritsCover: kind.inheritsCover,
      sortOrder,
    })
    .returning({ id: kinds.id });

  // 建了就是在用。目錄一列、「我在用」一列，兩張表一起寫
  await tx.insert(userKinds).values({ userId, kindId: created.id, sortOrder });

  await insertFields(tx, userId, created.id, kind);

  return created.id;
}

/** 認不得的模組丟掉：客戶端不能往資料庫塞任意字串 */
async function insertFields(tx: Tx, userId: string, kindId: string, kind: NewKind): Promise<void> {
  const modules = kind.modules.filter((key) => moduleDef(key));
  if (modules.length === 0) return;

  const rows = await Promise.all(
    modules.map(async (key, index) => ({
      userId,
      kindId,
      fieldKey: key,
      fieldId: await fieldIdFor(tx, key, kind.labels?.[key] || moduleDef(key)!.label),
      isVisible: true,
      sortOrder: index,
    })),
  );
  await tx.insert(mapKindField).values(rows);
}

const fromTemplate = (template: KindTemplate): NewKind => ({
  name: template.name,
  slug: template.key,
  modules: [...template.modules],
  amountUnit: template.amountUnit,
  inheritsCover: template.inheritsCover ?? false,
  labels: template.labels,
});

/** 排在同一個 group 的最後面。順序是各人的事，只看自己在用的那幾種 */
async function nextSortOrder(
  tx: Tx | typeof db,
  userId: string,
  group: KindGroup,
): Promise<number> {
  const [last] = await tx
    .select({ sortOrder: userKinds.sortOrder })
    .from(userKinds)
    .innerJoin(kinds, eq(kinds.id, userKinds.kindId))
    .where(and(eq(userKinds.userId, userId), eq(kinds.groupKey, group)))
    .orderBy(desc(userKinds.sortOrder))
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
 * 把一個類型底下的資料整批搬到另一個，然後關掉來源。
 *
 * 「顯化」與「週計劃」其實是同一件事，想併成「札記」——改名做不到，兩個類型
 * 不能共用一個網址。搬資料才是真正要做的事。
 *
 * 只在同一個 group 內搬：紀錄有作品那一層、片段沒有，跨 group 的欄位對不起來。
 * 三張表都試，不是這個 group 的那幾張什麼也不會做。
 */
export async function mergeKinds(userId: string, fromId: string, toId: string): Promise<void> {
  if (fromId === toId) throw new Error("不能併到自己身上");

  const [from] = await db.select().from(kinds).where(eq(kinds.id, fromId));
  const [to] = await db.select().from(kinds).where(eq(kinds.id, toId));
  if (!from || !to) throw new Error("找不到這個類型");
  if (from.groupKey !== to.groupKey) throw new Error("只能併到同一個分類底下的類型");

  await db.transaction(async (tx) => {
    await tx
      .update(works)
      .set({ kindId: toId })
      .where(and(eq(works.userId, userId), eq(works.kindId, fromId)));
    await tx
      .update(fragments)
      .set({ kindId: toId })
      .where(and(eq(fragments.userId, userId), eq(fragments.kindId, fromId)));
    await tx
      .update(writings)
      .set({ kindId: toId })
      .where(and(eq(writings.userId, userId), eq(writings.kindId, fromId)));

    // 搬完就空了，來源從「我在用」移掉
    await tx
      .delete(userKinds)
      .where(and(eq(userKinds.userId, userId), eq(userKinds.kindId, fromId)));
  });
}

/**
 * 關掉一個類型：從 setting_user_kinds 移掉那一列。
 *
 * 目錄（setting_kinds）與它的欄位設定都不動——預設類型是共用的，刪了會動到別人；
 * 自訂類型留著也不佔什麼，想再打開就插回來。這樣刪除永遠可逆。
 *
 * 底下還有資料就不給關：這些資料是一筆一筆手動記的，沒有還原路徑。
 * 想清掉就先把資料刪光，那一步本身就是確認。
 */
export async function hideKind(userId: string, kindId: string): Promise<void> {
  await db.delete(userKinds).where(and(eq(userKinds.userId, userId), eq(userKinds.kindId, kindId)));
}

/**
 * 改一個類型：名字、網址、單位、勾哪些模組。
 *
 * 共用列（user_id 是 NULL）不能直接改——那是全體共用的定義，改了會動到別人。
 * 遇到共用列就先複製一份成自己的，再把「我在用」指過去：對使用者來說就是改了，
 * 別人看到的還是原本那個。
 *
 * 改網址等於改路由，舊連結會失效——這是使用者自己按的，不特別擋。
 * 紀錄照 kind_id 關聯，不受影響。
 */
export async function updateKind(userId: string, kindId: string, patch: NewKind): Promise<string> {
  const [existing] = await db.select().from(kinds).where(eq(kinds.id, kindId));
  if (!existing) throw new Error("找不到這個類型");

  if (existing.userId === null) return forkKind(userId, existing, patch);

  return db.transaction(async (tx) => {
    await tx
      .update(kinds)
      .set({
        name: patch.name,
        slug: patch.slug,
        amountUnit: patch.amountUnit,
        inheritsCover: patch.inheritsCover,
      })
      .where(and(eq(kinds.id, kindId), eq(kinds.userId, userId)));

    await tx.delete(mapKindField).where(eq(mapKindField.kindId, kindId));
    await insertFields(tx, userId, kindId, patch);
    return kindId;
  });
}

/** 共用類型改成自己的：複製一列、把「我在用」指過去，原本那列留給別人 */
async function forkKind(
  userId: string,
  shared: typeof kinds.$inferSelect,
  patch: NewKind,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [{ sortOrder }] = await tx
      .select({ sortOrder: userKinds.sortOrder })
      .from(userKinds)
      .where(and(eq(userKinds.userId, userId), eq(userKinds.kindId, shared.id)));

    const created = await insertKind(tx, userId, shared.groupKey as KindGroup, patch, sortOrder);
    await tx
      .delete(userKinds)
      .where(and(eq(userKinds.userId, userId), eq(userKinds.kindId, shared.id)));
    return created;
  });
}

/**
 * 目錄裡已經有這個 slug 的話就重新啟用它，不要另外建一列。
 *
 * 關掉「書籍」再套一次範本，走 addKind 會插一列新的同名類型，原本那列
 * （系統共用的）沒人用卻還在——目錄會慢慢長出一堆重複。這支先撿現成的。
 *
 * 只認共用列與自己建的：別人的自訂類型不該被撿來用。
 * 回傳 kindId，沒有現成的就回 null，呼叫端再走 addKind。
 */
export async function reuseKind(
  userId: string,
  group: KindGroup,
  slug: string,
  name: string,
): Promise<string | null> {
  const [existing] = await db
    .select({ id: kinds.id })
    .from(kinds)
    .where(
      and(
        or(eq(kinds.userId, userId), isNull(kinds.userId)),
        eq(kinds.groupKey, group),
        eq(kinds.slug, slug),
        // 名字也要一樣才算「同一種」：自己填的剛好撞到 slug，該建新的而不是撿舊的
        eq(kinds.name, name),
      ),
    );
  if (!existing) return null;

  await db
    .insert(userKinds)
    .values({ userId, kindId: existing.id, sortOrder: await nextSortOrder(db, userId, group) })
    .onConflictDoNothing();

  return existing.id;
}

/**
 * 開帳號時先給的那幾種。
 *
 * 類型的定義是共用目錄（user_id 是 NULL 那幾列），不用各自建一份；要給的是
 * 「我在用哪些」——沒有這幾列，新帳號登進來會是一片空白。
 *
 * 只認 STARTER_KEYS：範本庫裡還有電影、Podcast、線上課程，那些要用再自己套。
 */
export async function seedKinds(userId: string): Promise<number> {
  const starters = await db
    .select({ id: kinds.id })
    .from(kinds)
    .where(and(isNull(kinds.userId), inArray(kinds.slug, [...STARTER_KEYS])))
    .orderBy(asc(kinds.sortOrder));

  if (starters.length === 0) return 0;

  await db
    .insert(userKinds)
    .values(starters.map((kind, index) => ({ userId, kindId: kind.id, sortOrder: index })))
    .onConflictDoNothing();

  return starters.length;
}
