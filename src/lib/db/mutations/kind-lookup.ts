import { and, eq } from "drizzle-orm";
import { type Tx } from "@/lib/db/client";
import { recordKinds, recordKindStatuses } from "@/lib/db/schema/kinds";

/**
 * 寫入時要把類型名與狀態名換成編號。
 *
 * 舊形狀帶的是「書籍」「已讀完」這種字串，新表存的是外鍵——資料庫才擋得住
 * 指向不存在的類型。找不到就丟錯，不默默寫一個空的進去。
 */

export async function kindIdByName(tx: Tx, userId: string, name: string): Promise<string> {
  const [kind] = await tx
    .select({ id: recordKinds.id })
    .from(recordKinds)
    .where(and(eq(recordKinds.userId, userId), eq(recordKinds.name, name)));
  if (!kind) throw new Error(`沒有「${name}」這個類型`);
  return kind.id;
}

/** 狀態用標籤比對：舊形狀存的是「已讀完」而不是 done */
export async function statusIdByLabel(tx: Tx, kindId: string, label: string): Promise<string> {
  const rows = await tx
    .select({ id: recordKindStatuses.id, label: recordKindStatuses.label })
    .from(recordKindStatuses)
    .where(eq(recordKindStatuses.kindId, kindId));

  const hit = rows.find((row) => row.label === label) ?? rows[0];
  if (!hit) throw new Error("這個類型沒有任何狀態");
  return hit.id;
}
