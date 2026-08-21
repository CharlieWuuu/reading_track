/**
 * POST 時包住整筆資料的那個鍵：`{ sheetId, book: {...} }`。
 *
 * 路徑是複數、鍵是單數，兩邊各寫一次就會有人多打一個 s——書寫就這樣壞了很久
 * （送 `writings`、route 讀 `writing`，POST 一路 400）。集中在這裡，兩邊都吃同一份。
 */
export const ITEM_KEYS = {
  books: "book",
  articles: "article",
  writings: "writing",
} as const;

export type Resource = keyof typeof ITEM_KEYS;
