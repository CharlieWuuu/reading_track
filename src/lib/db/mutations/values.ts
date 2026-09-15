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

/**
 * 年份：負數是西元前，所以不能用 toInt（那支把負號也抽掉，而且 0 與負數一律當沒填）。
 * 0 年不存在，拿它當「沒填」是安全的。
 */
export function toYear(value: string | undefined | null): number | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n !== 0 ? n : null;
}

/** 經緯度：負數與小數點都是有意義的，0 也是合法座標（赤道、本初子午線） */
export function toFloat(value: string | undefined | null): number | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
