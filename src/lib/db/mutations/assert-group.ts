import { eq } from "drizzle-orm";
import { KindGroup } from "@/config/record-kinds";
import { db } from "@/lib/db/client";
import { kinds } from "@/lib/db/schema/kinds";

/**
 * 寫進去之前先確認這個類型真的屬於這張表該服務的 group。
 *
 * 三個 group 三張表（records → domain_works/records、fragments → domain_fragments、
 * writings → domain_writings），對應關係在 API 那層分岔。但 mutation 自己收的是
 * 一個 kindId，誰呼叫它、有沒有分岔對，它完全不知道。
 *
 * 結果就是「思緒」（writings）的兩筆資料寫進了 domain_fragments。沒有人擋，
 * 也沒有人發現——直到側欄的數字跟清單對不上，而那兩筆在畫面上根本點不到。
 *
 * 擋在這裡而不是只擋在 API：API 那條分岔今天是對的，但它是唯一的防線，
 * 改錯一次就又漏進去。寫入層擋的話，不管誰呼叫都不會寫錯表。
 */
export async function assertKindGroup(kindId: string, expected: KindGroup): Promise<void> {
  const [row] = await db
    .select({ group: kinds.groupKey, name: kinds.name })
    .from(kinds)
    .where(eq(kinds.id, kindId));

  if (!row) throw new Error(`找不到類型 ${kindId}`);
  if (row.group !== expected) {
    throw new Error(
      `「${row.name}」屬於 ${row.group}，不能寫進 ${expected} 的表——` +
        "資料會出現在側欄的計數裡，但清單讀不到它",
    );
  }
}
