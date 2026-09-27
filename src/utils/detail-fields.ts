import { PRIVATE_MARK } from "@/config/privacy";
import { Kind } from "@/lib/db/queries/kinds";
import { fieldsOf, resolveFormModules } from "@/utils/module-form";

/**
 * 一筆資料照類型勾的模組，攤成詳情頁要畫的欄位。
 *
 * 純函式，不碰畫面——「有哪幾格、各叫什麼」跟「畫成兩欄還是右欄」是兩件事。
 * 勾了的欄位一律列出來，空的也列：看得出哪裡還沒填。
 */

export type DetailEntry = { key: string; label: string; value: string };

const LONG_KEYS = new Set(["body"]); // 長文自己一段，不擠進資訊表
const IMAGE_KEYS = new Set(["coverUrl"]); // 存的是圖片 key，畫成圖不列成字

/** 勾了的每一欄，照設定頁的順序與名字；只有一欄的模組用模組名，多欄的用各欄預設名 */
function entriesOf(
  kind: Kind,
  values: Record<string, string>,
): (DetailEntry & { flag: boolean })[] {
  return resolveFormModules(kind.modules).flatMap((form) => {
    const fields = fieldsOf([form]);
    return fields.map((field) => ({
      key: field.key,
      label: fields.length === 1 ? form.label : field.defaultLabel,
      value: values[field.key] ?? "",
      flag: field.type === "flag",
    }));
  });
}

const filled = (value: string): boolean => Boolean(value.trim());

/** 有內容的長文，各自一段 */
export const longFields = (kind: Kind, values: Record<string, string>): DetailEntry[] =>
  entriesOf(kind, values)
    .filter((entry) => LONG_KEYS.has(entry.key) && filled(entry.value))
    .map(({ key, label, value }) => ({ key, label, value }));

/**
 * 資訊表那幾列。標題不列；有內容的長文、圖片，以及頁面別處已經畫出來的（shown）不重複列。
 * 空的照樣列，value 是空字串，畫面自己決定怎麼表示。旗標一律寫成是／否。
 */
export const factFields = (
  kind: Kind,
  values: Record<string, string>,
  shown: ReadonlySet<string> = new Set(),
): DetailEntry[] =>
  entriesOf(kind, values)
    .filter(({ key, value }) => {
      if (key === "title") return false;
      const elsewhere = shown.has(key) || LONG_KEYS.has(key) || IMAGE_KEYS.has(key);
      return !(elsewhere && filled(value));
    })
    .map(({ key, label, value, flag }) => ({
      key,
      label,
      value: flag ? (value === PRIVATE_MARK ? "是" : "否") : value,
    }));
