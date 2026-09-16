/**
 * 統計的看法清單：每一種的網址參數與中文名。
 *
 * 「哪個類型有哪幾種看法」不在這裡——那是從勾選的模組推出來的
 * （`utils/stats/from-modules` 的 `viewsOfModules`）。原本這支還有一張
 * `VIEWS_BY_TYPE` 寫死四個類型，開一種新的就得回來補一列。
 */

export const STATS_VIEWS = [
  { key: "chart", label: "圖表" },
  { key: "calendar", label: "月曆" },
  { key: "timeline", label: "數線" },
  { key: "map", label: "地圖" },
  // 跟書籍的「數線」分開命名：那條是閱讀期間，這條是關鍵字指到的年代
  { key: "era", label: "年代" },
] as const;

export type StatsView = (typeof STATS_VIEWS)[number]["key"];
