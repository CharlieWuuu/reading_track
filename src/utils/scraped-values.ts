import { Book } from "@/types/book";
import { fillFields } from "./autofill";

/**
 * 爬回來的書籍資料換成通用表單的欄位鍵。
 *
 * 爬蟲回的是 Book 那套舊欄名（author／isbn），通用表單認的是
 * 欄位庫那套（creator／externalId）——兩邊對照寫在這裡一份，
 * 不散在呼叫端。
 */
const BOOK_TO_FIELD: Record<string, string> = {
  title: "title",
  author: "creator",
  publisher: "publisher",
  isbn: "externalId",
  coverUrl: "coverUrl",
  language: "language",
  pageCount: "amount",
  sourceUrl: "externalUrl",
};

/** 書籍資料換成欄位鍵。補齊來源與貼連結抓取共用 */
export function bookToFields(found: Partial<Book>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(BOOK_TO_FIELD).flatMap(([bookKey, fieldKey]): [string, string][] => {
      const value = found[bookKey as keyof Book];
      return typeof value === "string" ? [[fieldKey, value]] : [];
    }),
  );
}

/** 只補空欄位，已經填了的不蓋——規則見 fillFields */
export const fillFromBook = (
  current: Record<string, string>,
  found: Partial<Book>,
  allowed: ReadonlySet<string>,
) => fillFields(current, bookToFields(found), allowed);

/** 只留有填東西的那幾格。帶入上一筆時拿它保住使用者已經打過的字 */
export const pickFilled = (values: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value?.trim()));
