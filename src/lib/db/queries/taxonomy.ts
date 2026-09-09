import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recordTopics } from "@/lib/db/schema/taxonomy";

/**
 * 主題樹攤成「節點 → 領域／次領域」。
 *
 * 舊形狀把樹壓成兩個欄位，所以有父節點的自己算次領域、沒有的就是領域本身。
 * 樹超過兩層時只取最近的父節點——舊欄位裝不下更多，等 UI 改形狀才會用到全路徑。
 */
export async function typePaths(
  userId: string,
): Promise<Map<string, { domain: string; subDomain: string }>> {
  const rows = await db
    .select({ id: recordTopics.id, name: recordTopics.name, parentId: recordTopics.parentId })
    .from(recordTopics)
    .where(eq(recordTopics.userId, userId));

  const byId = new Map(rows.map((r) => [r.id, r]));
  return new Map(
    rows.map((r) => {
      const parent = r.parentId ? byId.get(r.parentId) : undefined;
      return [
        r.id,
        parent ? { domain: parent.name, subDomain: r.name } : { domain: r.name, subDomain: "" },
      ];
    }),
  );
}

export interface PrivacyFlagNode {
  id: string;
  name: string;
  isPrivate: boolean;
  children: PrivacyFlagNode[];
}

export interface PrivacyFlags {
  types: PrivacyFlagNode[]; // 主題樹
}

/**
 * 設定頁那份「哪些標了私人」的清單。
 *
 * 旗標掛在主題與關鍵字身上，之前只能直接改資料庫；這支把它們撈成同一個形狀，
 * 畫面才不用替每一種各寫一遍。
 */
export async function privacyFlags(userId: string): Promise<PrivacyFlags> {
  const typeRows = await db
    .select({
      id: recordTopics.id,
      name: recordTopics.name,
      parentId: recordTopics.parentId,
      isPrivate: recordTopics.isPrivate,
    })
    .from(recordTopics)
    .where(eq(recordTopics.userId, userId));

  const byParent = new Map<string, typeof typeRows>();
  for (const row of typeRows) {
    if (!row.parentId) continue;
    byParent.set(row.parentId, [...(byParent.get(row.parentId) ?? []), row]);
  }
  const byName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, "zh-Hant");

  const toNode = (row: (typeof typeRows)[number]): PrivacyFlagNode => ({
    id: row.id,
    name: row.name,
    isPrivate: row.isPrivate,
    children: (byParent.get(row.id) ?? []).sort(byName).map(toNode),
  });

  return {
    types: typeRows
      .filter((r) => !r.parentId)
      .sort(byName)
      .map(toNode),
  };
}
