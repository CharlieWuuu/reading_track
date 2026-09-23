import { BOOK_VIEW_MODES, BookViewMode, isBookViewMode } from "@/stores/use-book-view-store";

/**
 * 一個類型有哪幾種看法。
 *
 * 本來寫死在 records/books 與 records/articles 兩支頁面檔，所以只有那兩種點進去
 * 有檢視切換，自訂類型永遠只有一種看法——又一處二等公民。改成類型自己勾。
 *
 * 跟 card_style 是兩層：這裡切的是版面（整頁怎麼排），card_style 決定一筆長什麼樣。
 * 兩者正交——概覽底下可以排封面卡，也可以排佳句。
 */

export const KIND_VIEWS = [
  { key: "overview", label: "概覽" },
  { key: "table", label: "表格" },
  { key: "card", label: "卡片" },
  { key: "stats", label: "統計" },
] as const satisfies readonly { key: BookViewMode; label: string }[];

/** 一種都沒勾就退回概覽：頁面總要畫得出東西 */
const FALLBACK: BookViewMode[] = ["overview"];

/** 新類型預設給概覽與表格。統計要勾了模組才畫得出圖，卡片要有封面才好看，兩個都不預設 */
export const DEFAULT_VIEWS: BookViewMode[] = ["overview", "table"];

/** 資料庫存的是逗號相接的字串。認不得的丟掉，全丟光就退回概覽 */
export function toKindViews(value: string): BookViewMode[] {
  const picked = value.split(",").map((key) => key.trim());
  const valid = KIND_VIEWS.map((view) => view.key).filter(
    (key) => picked.includes(key) && isBookViewMode(key),
  );
  return valid.length > 0 ? valid : FALLBACK;
}

/** 存回資料庫的形狀。照 KIND_VIEWS 的順序，不照使用者點選的順序 */
export const fromKindViews = (views: readonly BookViewMode[]): string =>
  BOOK_VIEW_MODES.filter((key) => views.includes(key)).join(",");
