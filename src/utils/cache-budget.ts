/** localStorage 一個 origin 大約 5MB，留一半給別的 key（設定、側欄狀態…） */
export const CACHE_BUDGET_BYTES = 2_500_000;

/**
 * UTF-16 存進 localStorage，一個字元大約兩個位元組。
 * 不用 TextEncoder：那算的是 UTF-8，跟實際佔用對不上。
 */
export function approximateBytes(value: string): number {
  return value.length * 2;
}

/**
 * 把快取修剪到預算之內：從最大的那一筆開始丟。
 *
 * 為什麼不是「超過就整份不存」——原本的寫法是 setItem 失敗就 catch 掉，
 * 結果一旦資料變大就變成完全沒有快取，每次開啟都空白等載入，而且沒有任何跡象。
 * 丟掉最大的那一筆，剩下的小表（文章、書寫）還是墊得住畫面。
 *
 * 回傳留下來的項目與丟掉的鍵，呼叫端才說得出「這次少存了什麼」。
 */
export function trimToBudget<T>(
  entries: [string, T][],
  budget = CACHE_BUDGET_BYTES,
): { kept: [string, T][]; dropped: string[] } {
  const sized = entries.map(([key, value]) => ({
    key,
    value,
    bytes: approximateBytes(JSON.stringify(value)),
  }));

  const total = sized.reduce((sum, item) => sum + item.bytes, 0);
  if (total <= budget) return { kept: entries, dropped: [] };

  // 由大到小丟，丟到總量進得了預算為止
  const byBytes = [...sized].sort((a, b) => b.bytes - a.bytes);
  const dropped = new Set<string>();
  let size = total;
  for (const item of byBytes) {
    if (size <= budget) break;
    dropped.add(item.key);
    size -= item.bytes;
  }

  return {
    kept: entries.filter(([key]) => !dropped.has(key)),
    dropped: [...dropped],
  };
}
