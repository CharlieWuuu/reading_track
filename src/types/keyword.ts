/** 關鍵字主檔的一列。全部存純文字，Sheet 打開來要看得懂 */
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

/** 起訖畫成數線要的是數字；只有單邊也回得出來，另一邊給 null */
export function parseSpan(value: string): { from: number | null; to: number | null } | null {
  const match = value.match(/^\s*(-?\d+)?\s*[－–—-]\s*(-?\d+)?\s*$/);
  if (!match || (!match[1] && !match[2])) return null;
  return {
    from: match[1] ? Number(match[1]) : null,
    to: match[2] ? Number(match[2]) : null,
  };
}
