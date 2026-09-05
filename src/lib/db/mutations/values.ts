/**
 * 表單送過來的一律是字串，資料庫的欄位不是。空字串在 date 欄位上會讓
 * Postgres 直接丟 DateTimeParseError——沒填日期的書因此存不進去，
 * 所以「沒填」要在寫入前就變成 null。
 */

/** 空字串（或只有空白）就是沒填 */
export function toDate(value: string | undefined | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

/** 數字欄位：抽掉非數字，0 與負數當作沒填 */
export function toInt(value: string | undefined | null): number | null {
  const n = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}
