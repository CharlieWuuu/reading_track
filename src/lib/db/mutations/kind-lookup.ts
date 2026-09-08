import { and, eq, isNull, or } from "drizzle-orm";
import { type Tx } from "@/lib/db/client";
import { kinds } from "@/lib/db/schema/kinds";

/**
 * 寫入時要把類型名換成編號。
 *
 * 舊形狀帶的是「書籍」這種字串，新表存的是外鍵——資料庫才擋得住指向不存在的
 * 類型。找不到就丟錯，不默默寫一個空的進去。
 *
 * user_id 是 NULL 代表系統預設，所有人都看得到，所以查詢要連它一起找。
 */

export async function kindIdByName(tx: Tx, userId: string, name: string): Promise<string> {
  const [kind] = await tx
    .select({ id: kinds.id })
    .from(kinds)
    .where(and(or(eq(kinds.userId, userId), isNull(kinds.userId)), eq(kinds.name, name)));
  if (!kind) throw new Error(`沒有「${name}」這個類型`);
  return kind.id;
}
