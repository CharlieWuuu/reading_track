import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const DEFAULT_TIMEOUT_MS = 12000;

export async function fetchText(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T | null> {
  const text = await fetchText(url, timeoutMs);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function fetchDom(url: string, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const html = await fetchText(url, timeoutMs);
  return html ? cheerio.load(html) : null;
}

/** 把整頁純文字壓成單行，方便用「頁數：352頁」這種標籤取值 */
export function flatText($: cheerio.CheerioAPI): string {
  return $("body").text().replace(/\s+/g, " ");
}

/** 取出 "標籤：值" 形式的欄位，值到下一個全形冒號欄位為止 */
export function labelValue(text: string, label: string, maxLen = 40): string {
  const re = new RegExp(`${label}\\s*[:：]\\s*([^:：]{1,${maxLen}})`);
  const match = text.match(re);
  if (!match) return "";
  // 下一個標籤會黏在值後面（例："繁體中文裝訂方式"），切掉尾巴的標籤字樣
  return match[1].replace(/\s*[一-龥A-Za-z]{2,6}$/, "").trim() || match[1].trim();
}

export function digitsOnly(value: string): string {
  const match = value.replace(/,/g, "").match(/\d+/);
  return match ? match[0] : "";
}

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
  return Math.max(
    score(mainTitle(candidate), mainTitle(query)),
    score(candidate, query) * 0.9
  );
}
