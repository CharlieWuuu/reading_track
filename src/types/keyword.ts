/** 關鍵字主檔的一列。年份與座標存數字，其餘存純文字 */
export interface KeywordInfo {
  /** 這一列自己的編號。網址、詳情頁、編輯都認它——名字使用者改得掉，也可能重複 */
  id: string;
  name: string;
  /** 自己貼的標籤，多個以頓號相接；跟維基查詢無關，見 lookup 裡的說明 */
  tags: string;
  /** 經緯度分開存；沒有座標就是 null */
  latitude: number | null;
  longitude: number | null;
  /** 生卒或存續的那段年份。負數是西元前；還在的話訖是 null */
  startYear: number | null;
  endYear: number | null;
  wikiUrl: string;
  summary: string;
  /** 這個字第一次被記下的時間（ISO）。概覽頁的頭條、排序用這個 */
  createdAt: string;
}

export const EMPTY_KEYWORD_INFO: Omit<KeywordInfo, "id" | "name" | "createdAt"> = {
  tags: "",
  latitude: null,
  longitude: null,
  startYear: null,
  endYear: null,
  wikiUrl: "",
  summary: "",
};

/** 一年顯示成字串；負數是西元前 */
const year = (value: number): string => (value < 0 ? `前${-value}` : String(value));

/**
 * 起訖年顯示成一行。拆欄之前這裡是一整組剖析器——破折號有四種寫法、
 * 西元前的負號跟破折號長得一樣、iOS 舊版 Safari 不支援 lookbehind。
 * 現在兩個數字直接組字串就好。
 *
 * 只有起沒有訖（還活著、還在）就留破折號後面空著。
 */
export function formatSpan(from: number | null, to: number | null): string {
  if (from === null && to === null) return "";
  if (from !== null && from === to) return year(from);
  return `${from === null ? "" : year(from)}－${to === null ? "" : year(to)}`;
}
