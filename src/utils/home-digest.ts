import { FragmentRow } from "@/lib/db/queries/catalog";

/**
 * 片段依日期排的算式。全是純函式，畫面只負責排版。
 *
 * 日期一律是 "YYYY-MM-DD" 字串，字串比大小就是時間先後，不進 Date。
 */

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
