import { Kind } from "@/lib/db/queries/kinds";
import { fieldsOf, FormModule, resolveFormModules } from "@/utils/record-form";

/**
 * 一筆資料照類型勾的模組，攤成詳情頁要畫的欄位。
 *
 * 純函式，不碰畫面——「有哪幾格、各叫什麼」跟「畫成兩欄還是右欄」是兩件事。
 *
 * 書籍的詳情頁本來自己手寫六格（狀態、開始、讀完、語言、來源、私人），
 * 跟這裡算出來的是同一件事，只是寫死的那份不會跟著設定頁改。
 */

export type DetailEntry = { key: string; label: string; value: string };

/** 長文自己一段，不擠進兩欄的資訊表——一段文章塞進半個欄寬讀不下去 */
const LONG_KEYS = new Set(["body"]);

export function detailFields(
  kind: Kind,
  values: Record<string, string>,
  /** 標題那一區已經講過的欄位，資訊表不重複列 */
  skip: ReadonlySet<string> = new Set(["title", "endDate"]),
): { longs: DetailEntry[]; shorts: DetailEntry[] } {
  const modules = resolveFormModules(kind.modules);
  const labelOf = (form: FormModule, index: number, fallback: string) =>
    index === 0 ? form.label : fallback;

  const longs: DetailEntry[] = [];
  const shorts: DetailEntry[] = [];

  for (const form of modules) {
    fieldsOf([form]).forEach((field, index) => {
      const value = values[field.key] ?? "";
      if (!value || skip.has(field.key)) return;
      const entry = { key: field.key, label: labelOf(form, index, field.defaultLabel), value };
      (LONG_KEYS.has(field.key) ? longs : shorts).push(entry);
    });
  }

  return { longs, shorts };
}
