import { kindHref } from "@/config/kind-routes";
import { KindGroup } from "@/config/record-kinds";

/**
 * 分頁的 key 是資料庫裡對應類型的 slug，網址跟著 kindHref 走。
 */

export const READING_TABS = [
  { key: "books", label: "書籍", group: "records" },
  { key: "articles", label: "文章", group: "records" },
  { key: "quotes", label: "佳句", group: "fragments" },
  { key: "vocabulary", label: "單字", group: "fragments" },
  { key: "keywords", label: "關鍵字", group: "fragments" },
] as const satisfies { key: string; label: string; group: KindGroup }[];

export type ReadingTab = (typeof READING_TABS)[number]["key"];

/** 統計那邊拆成類型 × 顯示方式了，見 config/stats-views.ts */
export const readingTabHref = (tab: ReadingTab): string =>
  kindHref(READING_TABS.find((t) => t.key === tab)!.group, tab);
