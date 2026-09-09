import { kindHref } from "@/config/kind-routes";

/**
 * 分頁的 key 是資料庫裡對應類型的 slug，網址跟著 kindHref 走。
 *
 * 收斂到 [slug] 通用頁是逐一進行的（見 refactor/kind-slug-routes 計畫），
 * 搬過去的類型走新網址，還沒搬的暫時留在 /reading/<tab>——這張表跟著進度更新。
 */

export const READING_TABS = [
  { key: "books", label: "書籍" },
  { key: "articles", label: "文章" },
  { key: "quotes", label: "佳句" },
  { key: "vocabulary", label: "單字" },
  { key: "keywords", label: "關鍵字" },
] as const;

export type ReadingTab = (typeof READING_TABS)[number]["key"];

/** 已經收斂到 [slug] 通用頁的分頁，統計那邊拆成類型 × 顯示方式了，見 config/stats-views.ts */
const MIGRATED_HREF: Partial<Record<ReadingTab, string>> = {
  books: kindHref("records", "books"),
};

export const readingTabHref = (tab: ReadingTab) => MIGRATED_HREF[tab] ?? `/reading/${tab}`;
