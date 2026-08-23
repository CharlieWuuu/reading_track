import { ITEM_KEYS } from "@/config/item-keys";
import { Writing } from "@/types/writing";

/** 新增一則紀事。從書頁順手寫的那種也走這裡 */
export async function createWriting(sheetId: string, writing: Writing): Promise<void> {
  const res = await fetch("/api/writings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheetId, [ITEM_KEYS.writings]: writing }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "儲存失敗");
}
