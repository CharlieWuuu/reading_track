/**
 * 頁面網址集中在這裡。
 *
 * 之前散在 16 處各自拼字串，`/notes` 併進 `/reading`、`journal` 改名 `writing` 時
 * 全部漏掉——因為拼出來的字串 grep 不到。路由再搬時只要改這一支。
 *
 * API 的路徑不在這裡：那是另一套命名（`/api/writings` 是複數，頁面是單數），
 * 拿其中一邊去猜另一邊正是原本的錯。
 */

/** 存完要回到原本的畫面，所以把當時的 query 一路帶著走 */
const withBack = (href: string, back?: string | null) =>
  back ? `${href}?back=${encodeURIComponent(back)}` : href;

export const bookHref = (id: string, back?: string | null) =>
  withBack(`/reading/books/${id}`, back);

export const bookEditHref = (id: string, back?: string | null) =>
  withBack(`/reading/books/${id}/edit`, back);

export const articleHref = (id: string) => `/reading/articles/${id}`;
export const articleEditHref = (id: string) => `/reading/articles/${id}/edit`;

export const writingHref = (id: string) => `/writing/${id}`;
export const writingEditHref = (id: string) => `/writing/${id}/edit`;

export const quoteHref = (id: string) => `/reading/quotes/${id}`;
export const quoteEditHref = (id: string) => `/reading/quotes/${id}/edit`;

/**
 * 單字的鍵是詞本身而不是編號：同一個詞在不同書各有一列，那一頁一次看完（改完）
 * 所有列。換成 row id 等於改成「只看其中一次相遇」，那不是這一頁在講的事。
 */
export const vocabularyHref = (word: string) => `/reading/vocabulary/${encodeURIComponent(word)}`;

export const vocabularyEditHref = (word: string) =>
  `/reading/vocabulary/${encodeURIComponent(word)}/edit`;

/**
 * 關鍵字沒有編號，網址上就用名字本身；名字可能有斜線與空白，一律編碼。
 *
 * 帶著 from 而不是 back：關鍵字可以從卡片牆、樹狀圖、地圖、年代，或某張表單
 * 點進來，改完要回得到「剛才在看的那個畫面」，而不是一律丟回關鍵字頁。
 */
export const keywordEditHref = (name: string, from?: string) => {
  const base = `/reading/keywords/${encodeURIComponent(name)}/edit`;
  return from ? `${base}?from=${encodeURIComponent(from)}` : base;
};

/** 設定的分頁走網址，側欄那顆頭像才指得進「帳號」 */
export const settingsTabHref = (tab: "connect" | "categories" | "maintenance" | "account") =>
  tab === "connect" ? "/settings" : `/settings?tab=${tab}`;
