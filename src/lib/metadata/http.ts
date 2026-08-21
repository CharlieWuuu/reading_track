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
