/** 純文字的來源不能拿去當連結，這裡只認 http(s) */
export function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}
