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

export const articleEditHref = (id: string) => `/reading/articles/${id}/edit`;

export const writingEditHref = (id: string) => `/writing/${id}/edit`;

export const quoteEditHref = (id: string) => `/reading/quotes/${id}/edit`;

export const vocabularyEditHref = (word: string) =>
  `/reading/vocabulary/${encodeURIComponent(word)}/edit`;
