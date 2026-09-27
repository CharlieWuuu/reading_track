import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { statusOf } from "./kind-list";

/**
 * 登入後首頁的算式。全是純函式，畫面只負責排版。
 *
 * 日期一律是 "YYYY-MM-DD" 字串，字串比大小就是時間先後，不進 Date。
 */

/** 一筆紀錄落在哪一天：讀完的算讀完那天，還在讀的算開始那天 */
export const recordDate = (row: RecordRow): string | null => row.endDate ?? row.startDate;

/** 片段與書寫落在哪一天：沒填日期就用建立時間的日期部分 */
export const fragmentDate = (row: FragmentRow): string | null =>
  row.date ?? (row.createdAt ? row.createdAt.slice(0, 10) : null);

const byDateDesc =
  <T>(getDate: (row: T) => string | null) =>
  (a: T, b: T) =>
    (getDate(b) ?? "").localeCompare(getDate(a) ?? "");

export function recentBy<T>(rows: T[], getDate: (row: T) => string | null, take: number): T[] {
  return [...rows].sort(byDateDesc(getDate)).slice(0, take);
}

/**
 * 頭條：正在讀的那一筆，最近開始的優先。
 * 一筆都沒有時退回最近讀完的——空著比放錯東西更難看。
 */
export function pickHeadline(
  records: RecordRow[],
  keysByKind: ReadonlyMap<string, ReadonlySet<string>> = new Map(),
): RecordRow | undefined {
  // 進行中照類型勾的日期判斷：沒勾開始日期的類型沒有「在讀」
  const reading = recentBy(
    records.filter((row) => statusOf(row, keysByKind.get(row.kindId)) === "reading"),
    (row) => row.startDate,
    1,
  );

  return reading[0] ?? recentBy(records, recordDate, 1)[0];
}
