import { moduleDef } from "@/config/modules";
import { BOOK_VIEW_MODES, BookViewMode } from "@/stores/use-book-view-store";

/**
 * 一個類型有哪幾種檢視。
 *
 * 只有表格要人勾，其餘照模組自己決定——勾了畫不出來的檢視，點進去是一頁空白：
 * 概覽一定有；卡片是封面牆，勾了封面圖才有；統計勾了能畫圖的模組才有。
 *
 * 這裡是版面：整頁怎麼排。一筆長什麼樣是 card_style，概覽與其他地方照它畫。
 */

export const VIEW_LABELS: Record<BookViewMode, string> = {
  overview: "概覽",
  table: "表格",
  card: "卡片",
  stats: "統計",
};

/** 新類型預設有表格 */
export const DEFAULT_VIEWS: BookViewMode[] = ["overview", "table"];

/** 統計：判斷用模組庫既有的 stat 欄位，不在這裡另外定義「什麼算有數值」 */
export const hasStats = (modules: readonly string[]): boolean =>
  modules.some((key) => (moduleDef(key)?.stat?.length ?? 0) > 0);

/** 卡片是封面牆：只看自己的封面圖；沿用出處的封面不算，那是別人的封面 */
export const hasCover = (modules: readonly string[]): boolean => modules.includes("cover");

export type ViewState = {
  key: BookViewMode;
  label: string;
  on: boolean;
  /** 由模組決定、不能手動改的 */
  locked: boolean;
};

/** 設定頁那排勾選框：每種檢視有沒有、能不能改 */
export function viewStates(
  views: readonly BookViewMode[],
  modules: readonly string[],
): ViewState[] {
  const auto: Record<BookViewMode, boolean | null> = {
    overview: true,
    table: null, // 只有這個要人勾
    card: hasCover(modules),
    stats: hasStats(modules),
  };
  return BOOK_VIEW_MODES.map((key) => ({
    key,
    label: VIEW_LABELS[key],
    on: auto[key] ?? views.includes(key),
    locked: auto[key] !== null,
  }));
}

/** 這個類型實際有的幾種檢視，照固定順序 */
export const viewsOfKind = (
  views: readonly BookViewMode[],
  modules: readonly string[],
): BookViewMode[] =>
  viewStates(views, modules)
    .filter((view) => view.on)
    .map((view) => view.key);

/** 資料庫存的是逗號相接的字串，只有表格是存的；其餘是算出來的，舊資料存的丟掉 */
export const toKindViews = (value: string): BookViewMode[] =>
  value.split(",").some((key) => key.trim() === "table") ? ["overview", "table"] : ["overview"];

/** 存回資料庫的形狀：只存要人勾的那個 */
export const fromKindViews = (views: readonly BookViewMode[]): string =>
  views.includes("table") ? "overview,table" : "overview";
