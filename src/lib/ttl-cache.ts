/**
 * 一段時間內同一把鑰匙只算一次。
 *
 * 存的是 promise 不是結果：同一瞬間的併發請求共用同一趟，不會各打各的。
 * 算失敗就把那一格丟掉，下次重算——失敗不該被記住。
 */
type Entry<T> = { value: Promise<T>; at: number };

export function ttlCache<T>(ttlMs: number, compute: (key: string) => Promise<T>) {
  const entries = new Map<string, Entry<T>>();

  return {
    get(key: string): Promise<T> {
      const hit = entries.get(key);
      if (hit && Date.now() - hit.at < ttlMs) return hit.value;

      const value = compute(key).catch((err) => {
        entries.delete(key);
        throw err;
      });
      entries.set(key, { value, at: Date.now() });
      return value;
    },
    forget(key: string) {
      entries.delete(key);
    },
  };
}
