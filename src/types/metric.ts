/**
 * 一次量測。同一則紀事會有很多列——這是整個系統唯一一張「一件事很多列」的表。
 *
 * 它是量測不是紀錄：只放數字，想法一律寫在紀事那則本身。
 * 不然它會慢慢長成第二個紀事表，然後就不知道東西該去哪裡找了。
 */
export interface Metric {
  id: string;
  /** 量測的那一天，不是發表日 */
  date: string;
  writingId: string;
  /** 舊欄位。資料庫靠 writingId join 得到標題，這裡留著是為了型別相容 */
  title: string;
  platform: string;
  views: string;
  /** vocus 分「點進來」與「真的讀了」，後者才填得出來；HackMD 沒有 */
  reads: string;
}
