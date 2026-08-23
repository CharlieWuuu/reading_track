/**
 * 從一段文字裡挑出 ISBN，去掉連字號。挑不到就回空字串。
 *
 * 來源給的格式很雜：「978-986-359-412-3」「9789863594123（平裝）」
 * 「ISBN：9789863594123 EISBN：...」都有。只認 10 碼與 13 碼，
 * 其餘一律當作沒抓到——寧可空著，也不要把商品編號當成 ISBN 存進 Sheet。
 */
export function normalizeIsbn(raw: string | null | undefined): string {
  if (!raw) return "";
  for (const token of raw.match(/[\dXx][\dXx-]{8,20}/g) ?? []) {
    const digits = token.replace(/-/g, "").toUpperCase();
    if (/^\d{13}$/.test(digits) || /^\d{9}[\dX]$/.test(digits)) return digits;
  }
  return "";
}
