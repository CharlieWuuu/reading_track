import { db } from "@/lib/db/client";
import { bookTypes, keywords, writingTypes } from "@/lib/db/schema/taxonomy";

/**
 * 類型樹攤成「節點 → 領域／次領域」。
 *
 * 舊形狀把樹壓成兩個欄位，所以有父節點的自己算次領域、沒有的就是領域本身。
 * 樹超過兩層時只取最近的父節點——舊欄位裝不下更多，等 UI 改形狀才會用到全路徑。
 */
export async function typePaths(): Promise<Map<string, { domain: string; subDomain: string }>> {
  const rows = await db
    .select({ id: bookTypes.id, name: bookTypes.name, parentId: bookTypes.parentId })
    .from(bookTypes);

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
  /** 子類型；書寫類型與關鍵字是平的，一律空陣列 */
  children: PrivacyFlagNode[];
}

export interface PrivacyFlags {
  types: PrivacyFlagNode[]; // 書與文章的類型樹
  writingTypes: PrivacyFlagNode[]; // 書寫的類型，平的
  keywords: PrivacyFlagNode[]; // 關鍵字，名字就是 id
}

/**
 * 設定頁那份「哪些標了私人」的清單。
 *
 * 旗標掛在類型與關鍵字身上，之前只能直接改資料庫；這支把三張表撈成同一個形狀，
 * 畫面才不用替每一種各寫一遍。
 */
export async function privacyFlags(): Promise<PrivacyFlags> {
  const [typeRows, writingRows, keywordRows] = await Promise.all([
    db
      .select({
        id: bookTypes.id,
        name: bookTypes.name,
        parentId: bookTypes.parentId,
        isPrivate: bookTypes.isPrivate,
      })
      .from(bookTypes),
    db
      .select({ id: writingTypes.id, name: writingTypes.name, isPrivate: writingTypes.isPrivate })
      .from(writingTypes),
    db.select({ name: keywords.name, isPrivate: keywords.isPrivate }).from(keywords),
  ]);

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
    writingTypes: writingRows.sort(byName).map((r) => ({ ...r, children: [] })),
    keywords: keywordRows
      .sort(byName)
      .map((r) => ({ id: r.name, name: r.name, isPrivate: r.isPrivate, children: [] })),
  };
}
