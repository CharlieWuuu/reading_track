/**
 * 清單頁的搜尋。
 *
 * 只做「所有詞都出現在這幾欄裡」這一件事：沒有權重、沒有排序、不模糊比對。
 * 這些資料是自己寫的，你搜的時候心裡已經有那一筆了，要的是把它撈出來，
 * 不是要一個猜你想找什麼的引擎。
 */
export function searchTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** 多個詞之間是 AND：一個一個字打下去，看到的東西要越來越少才符合直覺 */
export function matchesSearch(terms: string[], ...fields: (string | null | undefined)[]): boolean {
  if (terms.length === 0) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}
