/**
 * 頁面網址集中在這裡。
 *
 * 之前散在 16 處各自拼字串，`/notes` 併進 `/reading`、`journal` 改名 `writing` 時
 * 全部漏掉——因為拼出來的字串 grep 不到。路由再搬時只要改這一支。
 *
 * API 的路徑不在這裡：那是另一套命名（`/api/writings` 是複數，頁面是單數），
 * 拿其中一邊去猜另一邊正是原本的錯。
 */

import { kindHref } from "@/config/kind-routes";
import type { KindGroup } from "@/config/record-kinds";

/** 存完要回到原本的畫面，所以把當時的 query 一路帶著走 */
const withBack = (href: string, back?: string | null): string => {
  return back ? `${href}?back=${encodeURIComponent(back)}` : href;
};

const booksListHref = kindHref("records", "books");

export const bookHref = (id: string, back?: string | null): string => {
  return withBack(`${booksListHref}/${id}`, back);
};

export const bookEditHref = (id: string, back?: string | null): string => {
  return withBack(`${booksListHref}/${id}/edit`, back);
};

const articlesListHref = kindHref("records", "articles");

export const articleHref = (id: string): string => {
  return `${articlesListHref}/${id}`;
};

export const articleEditHref = (id: string): string => {
  return `${articlesListHref}/${id}/edit`;
};

/**
 * 書寫的單筆頁走這條固定路徑，不跟著類型的 slug 走。
 *
 * 心得、思緒、工作各是一個類型，但單筆頁長得一樣、查資料也只靠 id
 * （見 WritingDetailView）。連結只拿得到 id，要對應 slug 就得先查一次類型，
 * 為了一個不影響畫面的網址片段不值得。`writing` 在這裡是路徑，不是 slug。
 */
const writingsListHref = "/writings/writing";

export const writingHref = (id: string): string => {
  return `${writingsListHref}/${id}`;
};

export const writingEditHref = (id: string): string => {
  return `${writingsListHref}/${id}/edit`;
};

export const quotesListHref = kindHref("fragments", "quotes");

export const quoteHref = (id: string): string => {
  return `${quotesListHref}/${id}`;
};

export const quoteEditHref = (id: string): string => {
  return `${quotesListHref}/${id}/edit`;
};

export const vocabularyListHref = kindHref("fragments", "vocabulary");

/**
 * 單字的鍵是詞本身而不是編號：同一個詞在不同書各有一列，那一頁一次看完（改完）
 * 所有列。換成 row id 等於改成「只看其中一次相遇」，那不是這一頁在講的事。
 */
export const vocabularyHref = (word: string): string => {
  return `${vocabularyListHref}/${encodeURIComponent(word)}`;
};

export const vocabularyEditHref = (word: string): string => {
  return `${vocabularyListHref}/${encodeURIComponent(word)}/edit`;
};

/** 關鍵字沒有編號，網址上就用名字本身；名字可能有斜線與空白，一律編碼。 */
export const keywordHref = (name: string): string => {
  return `${kindHref("fragments", "keywords")}/${encodeURIComponent(name)}`;
};

/**
 * 帶著 from 而不是 back：關鍵字可以從卡片牆、樹狀圖、地圖、年代，或某張表單
 * 點進來，改完要回得到「剛才在看的那個畫面」，而不是一律丟回關鍵字頁。
 */
export const keywordEditHref = (name: string, from?: string): string => {
  const base = `${kindHref("fragments", "keywords")}/${encodeURIComponent(name)}/edit`;
  return from ? `${base}?from=${encodeURIComponent(from)}` : base;
};

type SettingsTab = "categories" | "kinds" | "maintenance" | "account";

/** 設定的分頁走網址，側欄那顆頭像才指得進「帳號」 */
export const settingsTabHref = (tab: SettingsTab): string => {
  return tab === "categories" ? "/settings" : `/settings?tab=${tab}`;
};

type WritingSource = {
  sourceId: string;
  sourceTitle: string;
  kind: string;
};

/** 從書籍／文章頁去寫一則心得：帶著出處過去，新的那則才知道自己延伸自哪一筆 */
export const writingNewHref = (source: WritingSource): string => {
  return `${writingsListHref}/new?${new URLSearchParams(source)}`;
};

/**
 * 網址那一段放的是「詞」而不是編號的類型。
 *
 * 單字與關鍵字都靠名字認人：同一個詞在不同書各有一列，詳情頁要一次列完，
 * 用編號就拆散了。`variant-registry` 替這兩種掛了專屬的詳情與編輯頁，
 * 這裡是同一件事的另一半——連過去的時候也要用詞。
 */
const WORD_KEYED = new Set(["vocabulary", "keywords"]);

/** 任何一筆的詳情頁。認不得的類型走通用路由，那是絕大多數 */
export const entryHref = (
  group: KindGroup,
  slug: string,
  entry: { id: string; title: string },
): string => {
  const segment = WORD_KEYED.has(slug) ? encodeURIComponent(entry.title) : entry.id;
  return `${kindHref(group, slug)}/${segment}`;
};
