/**
 * 分頁的 key 就是網址的一段，所以它跟 `app/` 底下的資料夾名是同一個約定。
 *
 * 放在這裡而不是留在元件裡，是為了讓測試對得到：`/stats/writings` 曾經一路 404，
 * 因為 key 寫成複數而資料夾是單數，而那是樣板字串拼出來的，grep 不到。
 */

export const READING_TABS = [
  { key: "books", label: "書籍" },
  { key: "articles", label: "文章" },
  { key: "quotes", label: "佳句" },
  { key: "vocabulary", label: "單字" },
  { key: "keywords", label: "關鍵字" },
] as const;

export type ReadingTab = (typeof READING_TABS)[number]["key"];

/** 分頁的網址：第二段就是 key。統計那邊拆成類型 × 顯示方式了，見 config/stats-views.ts */
export const readingTabHref = (tab: ReadingTab) => `/reading/${tab}`;
