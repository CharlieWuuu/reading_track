/**
 * 統計分成兩個問題：看哪一種東西（類型），以及怎麼看（顯示方式）。
 *
 * 原本四個分頁是 `books / articles / writing / calendar`，但月曆跟前三個不同層——
 * 前三個是類型，月曆是顯示方式。拆成兩顆選單之後，以後加一個類型或一種畫法
 * 都只是這張表上多一列或一格。
 */

export const STATS_TYPES = [
  { key: "books", label: "書籍" },
  { key: "articles", label: "文章" },
  { key: "writing", label: "書寫" },
] as const;

export type StatsType = (typeof STATS_TYPES)[number]["key"];

export const STATS_VIEWS = [
  { key: "chart", label: "圖表" },
  { key: "calendar", label: "月曆" },
  { key: "timeline", label: "數線" },
] as const;

export type StatsView = (typeof STATS_VIEWS)[number]["key"];

/**
 * 每種類型畫得出哪幾種看法。圖表一定在第一個：換類型時舊的看法不適用，
 * 就退回這一列的第一項，不要留一個空畫面。
 */
export const VIEWS_BY_TYPE: Record<StatsType, readonly StatsView[]> = {
  books: ["chart", "calendar", "timeline"],
  articles: ["chart", "calendar"],
  writing: ["chart", "calendar"],
};

export function isStatsType(value: string | undefined): value is StatsType {
  return STATS_TYPES.some((t) => t.key === value);
}

/** 網址上的 `?view=` 不適用於這個類型時退回圖表，而不是畫一片空白 */
export function resolveView(type: StatsType, raw: string | null | undefined): StatsView {
  const allowed = VIEWS_BY_TYPE[type];
  return allowed.find((v) => v === raw) ?? allowed[0];
}

export function viewsFor(type: StatsType) {
  return STATS_VIEWS.filter((v) => VIEWS_BY_TYPE[type].includes(v.key));
}

/** 圖表是預設，網址上不帶 `?view=chart`——分享出去的連結短一點 */
export function statsHref(type: StatsType, view: StatsView): string {
  return view === VIEWS_BY_TYPE[type][0] ? `/stats/${type}` : `/stats/${type}?view=${view}`;
}
