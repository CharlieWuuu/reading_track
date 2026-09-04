import { db } from "@/lib/db/client";
import { bookTypes } from "@/lib/db/schema/taxonomy";

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
