import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";

/**
 * 登入後首頁的算式。全是純函式，畫面只負責排版。
 *
 * 日期一律是 "YYYY-MM-DD" 字串，字串比大小就是時間先後，不進 Date。
 */

/** 一筆紀錄落在哪一天：讀完的算讀完那天，還在讀的算開始那天 */
export const recordDate = (row: RecordRow): string | null => row.endDate ?? row.startDate;

/** 片段與專欄落在哪一天：沒填日期就用建立時間的日期部分 */
export const fragmentDate = (row: FragmentRow): string | null =>
  row.date ?? (row.createdAt ? row.createdAt.slice(0, 10) : null);

const byDateDesc =
  <T>(getDate: (row: T) => string | null) =>
  (a: T, b: T) =>
    (getDate(b) ?? "").localeCompare(getDate(a) ?? "");

export function recentBy<T>(rows: T[], getDate: (row: T) => string | null, take: number): T[] {
  return [...rows].sort(byDateDesc(getDate)).slice(0, take);
}

/** month 是 "YYYY-MM"；沒有日期的不算進任何月份 */
export function countInMonth(dates: (string | null)[], month: string): number {
  return dates.filter((date) => date?.startsWith(month)).length;
}

const dayBefore = (date: string): string => {
  const [y, m, d] = date.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  return prev.toISOString().slice(0, 10);
};

/**
 * 連續幾天有紀錄。今天還沒記不算斷——一天還沒過完，
 * 所以從今天或昨天起算都可以，往回數到第一個空著的日子為止。
 */
export function streakDays(dates: (string | null)[], today: string): number {
  const seen = new Set(dates.filter((date): date is string => date !== null));
  let cursor = seen.has(today) ? today : dayBefore(today);
  let days = 0;

  while (seen.has(cursor)) {
    days += 1;
    cursor = dayBefore(cursor);
  }

  return days;
}

/**
 * 頭條：正在讀的那一筆，最近開始的優先。
 * 一筆都沒有時退回最近讀完的——空著比放錯東西更難看。
 */
export function pickHeadline(records: RecordRow[]): RecordRow | undefined {
  const reading = recentBy(
    records.filter((row) => row.statusKey === "reading"),
    (row) => row.startDate,
    1,
  );

  return reading[0] ?? recentBy(records, recordDate, 1)[0];
}
