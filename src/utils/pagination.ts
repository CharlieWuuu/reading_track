/** keyset 分頁用的游標：base64 包一組排序鍵，前端不解讀內容，原樣帶著翻頁 */

export function encodeCursor(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function decodeCursor<T>(cursor: string | null | undefined): T | null {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}
