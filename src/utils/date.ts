/**
 * 日期工具。
 *
 * 全站只有這一份：這些函式原本散在三張表單與 reflections 裡，
 * 光「今天」就有三種寫法（有的用 toISOString 再切字串，在台灣的早上八點前
 * 會拿到昨天）。日期是這個 app 最常出錯的東西，不該有第二個版本。
 *
 * 存進 Sheet 的格式是「2026-08-19」或「2026-08-19 14:32」——空白分隔是因為
 * 那一格也是給人讀的，T 只是機器的分隔符號。
 */

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** 本地時區的今天 */
export function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** 本地時區的此刻，記到分鐘 */
export function now(): string {
  const at = new Date();
  return `${today()} ${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/**
 * 「2026-08-19」或「2026-08-19 14:32」當成當地時區的那一刻。
 *
 * 不能直接 new Date(字串)：只有日期的那種會被當成 UTC 午夜，在西半球會倒退一天。
 * 時間是後來才加的，舊資料只有日期，所以時分一律可省略。
 */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [day, clock = ""] = value.trim().split(/[ T]/);
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return null;
  const [hh, mm] = clock.split(":").map(Number);
  const date = new Date(y, m - 1, d, hh || 0, mm || 0);
  return isNaN(+date) ? null : date;
}

/** 只有日期的舊資料不該憑空長出一個 00:00 */
export function timeLabel(value: string | null | undefined): string {
  const clock = value?.trim().split(/[ T]/)[1] ?? "";
  const [hh, mm] = clock.split(":");
  return hh && mm ? `${hh}:${mm}` : "";
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function startOfDay(date: Date): number {
  return +new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * 近的講關係、遠的講日期。
 *
 * 「今天」「昨天」比「8/19」好讀，是因為讀的人不用先想今天幾號；
 * 但這個優勢過了一週就沒了——「11 天前」還是得換算，不如直接給日期。
 */
export function dayLabel(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return "";

  const at = new Date();
  const days = Math.round((startOfDay(at) - startOfDay(date)) / 86400000);
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days > 1 && days < 7) return `週${WEEKDAYS[date.getDay()]}`;

  const md = `${date.getMonth() + 1}/${date.getDate()}`;
  return date.getFullYear() === at.getFullYear() ? md : `${date.getFullYear()}/${md}`;
}

/**
 * 時間戳只在當天有意義。
 *
 * 「上週三 14:32」的時分沒有人會用到——隔了幾天之後，人記得的是哪一天，不是幾點。
 * 今天的則相反：「今天」講了等於沒講，時間才是新資訊。
 */
export function whenLabel(value: string | null | undefined): string {
  const day = dayLabel(value);
  if (day !== "今天") return day;
  return timeLabel(value) || day; // 舊資料只有日期，退回「今天」
}

/** Sheet 上存的是空白分隔，datetime-local 要的是中間一個 T */
export function toDateTimeInput(value: string): string {
  if (!value.trim()) return "";
  const [day, clock = "00:00"] = value.trim().split(/[ T]/);
  return `${day}T${clock.slice(0, 5)}`;
}

export function fromDateTimeInput(value: string): string {
  return value.replace("T", " ").slice(0, 16);
}
