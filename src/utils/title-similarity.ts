function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[【】\[\]（）()《》〈〉「」:：,，.。!！?？\-—~～\s]/g, "");
}

/** 字元 bigram 的 Dice 係數，比「有幾個字重複」嚴格得多 */
function diceCoefficient(x: string, y: string): number {
  if (x.length < 2 || y.length < 2) return x === y ? 1 : 0;

  const bigrams = (s: string) => {
    const list: string[] = [];
    for (let i = 0; i < s.length - 1; i++) list.push(s.slice(i, i + 2));
    return list;
  };

  const left = bigrams(x);
  const right = bigrams(y);
  const pool = new Map<string, number>();
  for (const g of left) pool.set(g, (pool.get(g) ?? 0) + 1);

  let hits = 0;
  for (const g of right) {
    const count = pool.get(g) ?? 0;
    if (count > 0) {
      hits++;
      pool.set(g, count - 1);
    }
  }
  return (2 * hits) / (left.length + right.length);
}

/** 去掉「【暢銷新裝版】」與「：副標題」，留下主書名 */
function mainTitle(raw: string): string {
  return raw
    .replace(/【[^】]*】/g, "")
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .split(/[:：]/)[0];
}

function score(candidate: string, query: string): number {
  const x = normalizeTitle(candidate);
  const y = normalizeTitle(query);
  if (!x || !y) return 0;
  if (x === y) return 1;

  // 長度比：查詢佔標題的多少，用來懲罰「多出一大截」的標題
  const lengthRatio = Math.min(x.length, y.length) / Math.max(x.length, y.length);

  if (x.startsWith(y) || y.startsWith(x)) return 0.8 + 0.2 * lengthRatio;
  if (x.includes(y) || y.includes(x)) return 0.7 + 0.2 * lengthRatio;

  return diceCoefficient(x, y);
}

/**
 * 標題相似度 0~1，用來確認搜尋結果真的是同一本書。
 *
 * 主要比對「主書名」：副標題再長都還是同一本書，
 * 但「有聲書評：深度工作力」這種把關鍵字放在副標的，主書名對不上就會被刷掉。
 * 完整標題只當作次要依據，權重打折。
 */
export function titleSimilarity(candidate: string, query: string): number {
  return Math.max(score(mainTitle(candidate), mainTitle(query)), score(candidate, query) * 0.9);
}
