/** 關鍵字主檔的一列。全部存純文字，直接查資料庫也要看得懂 */
export interface KeywordInfo {
  name: string;
  /** 維基的主題分類，多個以頓號相接；刻意不含 Geography，理由見 lookup */
  topics: string;
  /** "25.033,121.565"，沒有座標就是空字串 */
  coordinates: string;
  /** 生卒或起訖，"1809－1882"；只有其中一邊就留另一邊空白 */
  span: string;
  wikiUrl: string;
  summary: string;
}

export const EMPTY_KEYWORD_INFO: Omit<KeywordInfo, "name"> = {
  topics: "",
  coordinates: "",
  span: "",
  wikiUrl: "",
  summary: "",
};

export function parseCoordinates(value: string): { lat: number; lon: number } | null {
  const [lat, lon] = value.split(",").map((n) => Number(n.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

/**
 * 起訖畫成數線要的是數字；只有單邊也回得出來，另一邊給 null。
 *
 * 手打的寫法很雜（1949／1949年4月6日／1949/4/6），一律只取年，
 * 後面的月日忽略——數線本來就以年為單位。沒有破折號就當成單一年份。
 */
export function parseSpan(value: string): { from: number | null; to: number | null } | null {
  const [left, right] = splitSpan(value);
  const from = parseYear(left);
  const to = right === undefined ? from : parseYear(right);
  if (from === null && to === null) return null;
  return { from, to };
}

/** 只切最外層的起訖破折號；西元前的負號長得一樣，所以負號前面要有數字才算分隔 */
function splitSpan(value: string): [string, string?] {
  const index = value.search(/(?<=\d\s*)[－–—-]/);
  if (index === -1) return [value];
  return [value.slice(0, index), value.slice(index + 1)];
}

/** 取開頭的年份，吃得下 "前384"、"-384"、"1949年4月6日"、"1949/4/6" */
function parseYear(value: string): number | null {
  const match = value.trim().match(/^(前\s*)?(-?\d+)/);
  if (!match) return null;
  const year = Number(match[2]);
  return match[1] ? -Math.abs(year) : year;
}

/** 兩個年份欄併回原本那一格；兩邊都空就是空字串 */
export function formatSpan(from: string, to: string): string {
  const a = from.trim();
  const b = to.trim();
  return a || b ? `${a}－${b}` : "";
}
