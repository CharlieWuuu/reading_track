import { Book } from "@/types/book";

/**
 * 爬回來的書籍資料換成通用表單的欄位鍵。
 *
 * 爬蟲回的是 Book 那套舊欄名（author／publisher／isbn），通用表單認的是
 * 欄位庫那套（creator／source／externalId）——兩邊對照寫在這裡一份，
 * 不散在呼叫端。
 */
const BOOK_TO_FIELD: Record<string, string> = {
  title: "title",
  author: "creator",
  publisher: "source",
  isbn: "externalId",
  coverUrl: "coverUrl",
  language: "language",
  pageCount: "amount",
  sourceUrl: "sourceUrl",
};

/**
 * 只補空欄位，已經填了的不蓋——手動改過的內容比抓回來的可信。
 *
 * 回傳補完的整份值與補了幾格，畫面要那個數字說「補上 N 個欄位」。
 */
export function fillFromBook(
  current: Record<string, string>,
  found: Partial<Book>,
  allowed: ReadonlySet<string>,
): { values: Record<string, string>; filled: number } {
  const values = { ...current };
  let filled = 0;

  for (const [bookKey, fieldKey] of Object.entries(BOOK_TO_FIELD)) {
    const value = found[bookKey as keyof Book];
    if (typeof value !== "string" || !value.trim()) continue;
    // 這個類型沒勾的欄位不補：表單上根本沒有那一格，補了也看不到
    if (!allowed.has(fieldKey) || values[fieldKey]?.trim()) continue;
    values[fieldKey] = value;
    filled += 1;
  }

  return { values, filled };
}

/** 只留有填東西的那幾格。帶入上一筆時拿它保住使用者已經打過的字 */
export const pickFilled = (values: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value?.trim()));
