import { moduleDef } from "@/config/modules";
import { BOOK_VIEW_MODES, BookViewMode, isBookViewMode } from "@/stores/use-book-view-store";

/**
 * 一個類型有哪幾種版面。
 *
 * 本來寫死在 records/books 與 records/articles 兩支頁面檔，所以只有那兩種點進去
 * 有檢視切換，自訂類型永遠只有一種顯示方式——又一處二等公民。改成類型自己勾。
 *
 * 這裡是版面：整頁怎麼排。一筆長什麼樣是 card_style，兩件事正交——
 * 同一種卡片可以排成概覽，也可以排成卡片牆。
 */

/** 概覽一定有，不列進勾選清單——那是這個類型的門面，沒得取消 */
export const ALWAYS: BookViewMode = "overview";

export const KIND_VIEWS = [
  { key: "table", label: "表格" },
  { key: "card", label: "卡片" },
] as const satisfies readonly { key: BookViewMode; label: string }[];

/** 新類型預設給概覽與表格 */
export const DEFAULT_VIEWS: BookViewMode[] = ["overview", "table"];

/**
 * 統計不給勾：畫得出圖才有它，畫不出來勾了也是一頁空白。
 *
 * 判斷用模組庫既有的 stat 欄位——哪些模組出哪幾張圖本來就寫在那裡，
 * 不在這裡另外定義一套「什麼算有數值」。
 */
export const hasStats = (modules: readonly string[]): boolean =>
  modules.some((key) => (moduleDef(key)?.stat?.length ?? 0) > 0);

/** 勾的版面加上自動判斷的統計，就是這個類型實際有的幾種檢視 */
export function viewsOfKind(
  views: readonly BookViewMode[],
  modules: readonly string[],
): BookViewMode[] {
  return hasStats(modules) ? [...views, "stats"] : [...views];
}

/** 資料庫存的是逗號相接的字串。認不得的丟掉，全丟光就退回概覽 */
export function toKindViews(value: string): BookViewMode[] {
  const picked = value.split(",").map((key) => key.trim());
  const valid = BOOK_VIEW_MODES.filter((key) => picked.includes(key) && isBookViewMode(key));
  // 概覽一定在，而且排第一；統計由 viewsOfKind 算，舊資料存的丟掉免得出現兩次
  return [ALWAYS, ...valid.filter((key) => key !== ALWAYS && key !== "stats")];
}

/** 存回資料庫的形狀。照固定順序，不照使用者點選的順序；統計是算出來的，不存 */
export const fromKindViews = (views: readonly BookViewMode[]): string =>
  BOOK_VIEW_MODES.filter((key) => key !== "stats" && views.includes(key)).join(",");
