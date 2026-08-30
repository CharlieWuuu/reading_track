/**
 * 新增書籍那一格輸入的是什麼：書名，還是一條連結。
 *
 * 兩件事共用一個框，所以要有人判斷。判斷寫成純函式放這裡，
 * 元件只負責把字交出來，規則才測得到。
 */
export type LookupQuery = { kind: "url"; url: string } | { kind: "title"; title: string } | null;

// 沒有空白、有點、點後面至少兩個字母＝像個網域。readmoo.com/book/123 這種貼法很常見
const LOOKS_LIKE_HOST = /^[^\s/]+\.[a-z]{2,}(\/|$)/i;

export function parseLookupQuery(raw: string): LookupQuery {
  const value = raw.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return { kind: "url", url: value };
  // 少了通訊協定的照樣當網址，補上 https:// 再送出去
  if (LOOKS_LIKE_HOST.test(value)) return { kind: "url", url: `https://${value}` };
  return { kind: "title", title: value };
}
