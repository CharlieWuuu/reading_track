import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const DEFAULT_TIMEOUT_MS = 12000;

/**
 * 「來源暫時不能用」與「這本書查不到」是兩件事。
 * Google Books 每日配額爆掉時回 429，若一律當成查不到，畫面就會謊稱
 * 「31 筆查不到資料」，其實是所有查詢都沒真的問到。
 */
export class SourceUnavailableError extends Error {
  constructor(public readonly detail: string) {
    super(detail);
    this.name = "SourceUnavailableError";
  }
}

interface FetchOptions {
  timeoutMs?: number;
  /** 額外的 request header，例如某些站台會檢查 Referer 防盜連 */
  headers?: Record<string, string>;
  /** true 時連線失敗／HTTP 錯誤會丟 SourceUnavailableError，而不是回 null */
  strict?: boolean;
  /**
   * 額外信任的中介憑證（PEM）。有些站台的 TLS 沒把中介憑證送齊，
   * 瀏覽器與 curl 會自己補、Node 不會，直接 fetch 會失敗在
   * UNABLE_TO_VERIFY_LEAF_SIGNATURE。補上缺的那張就能正常驗證，
   * 根憑證仍然照驗，不是把驗證關掉。
   */
  extraCa?: string;
}

/** 被限速時的等待秒數：1、2、4 秒，最多重試三次 */
const RETRY_DELAYS_MS = [1000, 2000, 4000];

/** 429／503 是「等一下再來」，重試有機會成功；其他錯誤重試也是白費 */
function isRateLimited(status: number) {
  return status === 429 || status === 503;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 對方叫我們等多久就等多久（Retry-After 可能是秒數或日期），
 * 沒給就用自己的退避時間。上限 10 秒，不然整批補齊會卡住。
 */
function retryDelay(res: Response, attempt: number): number {
  const header = res.headers.get("retry-after");
  const fallback = RETRY_DELAYS_MS[attempt];
  if (!header) return fallback;
  const seconds = Number(header);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : new Date(header).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return fallback;
  return Math.min(ms, 10000);
}

export async function fetchText(url: string, options: FetchOptions = {}): Promise<string | null> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, strict, extraCa } = options;
  if (extraCa) return fetchTextWithCa(url, { timeoutMs, headers, strict, extraCa });

  // 第一次加上重試次數，總共最多打 RETRY_DELAYS_MS.length + 1 次
  for (let attempt = 0; ; attempt++) {
    const outcome = await attemptFetchText(url, { timeoutMs, headers, strict }, attempt);
    if (outcome.kind === "done") return outcome.text;

    if (attempt >= RETRY_DELAYS_MS.length - 1) {
      // 重試用完還是被擋，照 strict 的約定決定是丟錯還是當成查不到
      if (strict) {
        throw new SourceUnavailableError(`HTTP ${outcome.status}（重試多次仍被限流）`);
      }
      return null;
    }
    await sleep(outcome.delayMs);
  }
}

type FetchOutcome =
  | { kind: "done"; text: string | null }
  | { kind: "rate-limited"; status: number; delayMs: number; text: null };

async function attemptFetchText(
  url: string,
  { timeoutMs, headers, strict }: FetchOptions & { timeoutMs: number },
  attempt: number,
): Promise<FetchOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        ...headers,
      },
      signal: controller.signal,
    });
    if (isRateLimited(res.status)) {
      return {
        kind: "rate-limited",
        status: res.status,
        delayMs: retryDelay(res, attempt),
        text: null,
      };
    }
    if (!res.ok) {
      if (strict) throw new SourceUnavailableError(`HTTP ${res.status}`);
      return { kind: "done", text: null };
    }
    return { kind: "done", text: await res.text() };
  } catch (err) {
    if (err instanceof SourceUnavailableError) throw err;
    if (strict) throw new SourceUnavailableError(err instanceof Error ? err.message : "連線失敗");
    return { kind: "done", text: null };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 走 node:https 的版本，只有需要補中介憑證時才用。
 * 內建的 fetch 沒有辦法指定 ca，所以這條路徑必須自己發請求。
 */
async function fetchTextWithCa(
  url: string,
  {
    timeoutMs,
    headers,
    strict,
    extraCa,
  }: Required<Pick<FetchOptions, "timeoutMs" | "extraCa">> & FetchOptions,
): Promise<string | null> {
  const [https, tls] = await Promise.all([import("node:https"), import("node:tls")]);

  return new Promise((resolve, reject) => {
    const fail = (detail: string) => {
      if (strict) reject(new SourceUnavailableError(detail));
      else resolve(null);
    };

    const req = https.request(
      url,
      {
        ca: [...tls.rootCertificates, extraCa],
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
          // 自己處理解壓縮沒有意義，直接要未壓縮的內容
          "Accept-Encoding": "identity",
          ...headers,
        },
        timeout: timeoutMs,
      },
      (res) => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          fail(`HTTP ${res.statusCode ?? "?"}`);
          return;
        }
        res.setEncoding("utf8");
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
        res.on("error", (err) => fail(err.message));
      },
    );

    req.on("timeout", () => {
      req.destroy();
      fail(`逾時（${timeoutMs / 1000} 秒）`);
    });
    req.on("error", (err) => fail(err.message));
    req.end();
  });
}

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T | null> {
  const text = await fetchText(url, options);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** 只確認資源存在（例如封面圖），不下載內容 */
export async function resourceExists(
  url: string,
  headers?: Record<string, string>,
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT, ...headers },
      signal: controller.signal,
    });
    return res.ok && (res.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchDom(url: string, options: FetchOptions = {}) {
  const html = await fetchText(url, options);
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
  return Math.max(score(mainTitle(candidate), mainTitle(query)), score(candidate, query) * 0.9);
}
