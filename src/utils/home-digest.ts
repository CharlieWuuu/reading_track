import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";

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

const HEADLINE_DAYS = 183; // 近半年

const daysBefore = (today: string, days: number): string =>
  new Date(Date.parse(today) - days * 86400000).toISOString().slice(0, 10);

/** 欄位填了幾格：頭條要挑資料最齊的 */
export const completeness = (row: RecordRow): number =>
  [
    row.coverUrl,
    row.body,
    row.creator,
    row.publisher,
    row.amount,
    row.domain,
    row.subDomain,
    row.attribute,
    row.language,
    row.platform,
    row.startDate,
    row.endDate,
  ].filter(Boolean).length;

const mostComplete = (rows: RecordRow[]): RecordRow | undefined =>
  [...rows].sort(
    (a, b) =>
      completeness(b) - completeness(a) || (recordDate(b) ?? "").localeCompare(recordDate(a) ?? ""),
  )[0];

/**
 * 頭條：近半年裡欄位最齊的一筆，同分取較近的；一定要有節錄（body）。
 * 近半年沒有就放寬到全部；全部都沒有 body 才退回最近的一筆——空著比放錯東西更難看。
 */
export function pickHeadline(records: RecordRow[], today: string): RecordRow | undefined {
  const since = daysBefore(today, HEADLINE_DAYS);
  const withBody = records.filter((row) => row.body.trim() !== "");
  const recent = withBody.filter((row) => (recordDate(row) ?? row.createdAt.slice(0, 10)) >= since);

  return mostComplete(recent) ?? mostComplete(withBody) ?? recentBy(records, recordDate, 1)[0];
}
