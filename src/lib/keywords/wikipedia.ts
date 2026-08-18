import { fetchJson } from "@/lib/metadata/http";
import { EMPTY_KEYWORD_INFO, KeywordInfo } from "@/types/keyword";

const WIKI_API = "https://zh.wikipedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const SUMMARY_MAX = 200;

type WikiPage = {
  missing?: boolean;
  title: string;
  extract?: string;
  coordinates?: Array<{ lat: number; lon: number }>;
  pageprops?: { wikibase_item?: string; disambiguation?: string };
};

type WikiResponse = { query?: { pages?: WikiPage[] } };

type WikidataTime = { time?: string };

type WikidataClaim = { mainsnak?: { datavalue?: { value?: WikidataTime } } };

type WikidataResponse = {
  entities?: Record<string, { claims?: Record<string, WikidataClaim[]> }>;
};

/**
 * 用條目名反查（redirects=1 會跟著轉址），刻意不做模糊搜尋——
 * 猜錯條目的代價是把不相干的摘要寫進主檔，寧可查不到讓使用者自己補。
 */
export async function lookupKeyword(name: string): Promise<KeywordInfo> {
  const empty: KeywordInfo = { name, ...EMPTY_KEYWORD_INFO };

  const page = (await fetchPage(name)) ?? (await fetchPage(await nearMatch(name)));
  if (!page) return empty;

  const coordinate = page.coordinates?.[0];
  const span = await fetchSpan(page.pageprops?.wikibase_item, Boolean(coordinate));

  return {
    name,
    // 學科一律留空，自己分：模型那套分類跟「你怎麼看這些字」是兩回事
    topics: "",
    coordinates: coordinate ? `${coordinate.lat},${coordinate.lon}` : "",
    span,
    wikiUrl: `https://zh.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    summary: summarize(page.extract ?? ""),
  };
}

/**
 * 條目名反查。`converttitles` 一定要帶：中文維基的條目只存在其中一種字體下，
 * 「後殖民主義」查不到而「后殖民主义」查得到，差別只在繁簡。
 */
async function fetchPage(title: string): Promise<WikiPage | null> {
  if (!title) return null;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    redirects: "1",
    converttitles: "zh",
    prop: "extracts|coordinates|pageprops",
    exintro: "1",
    explaintext: "1",
    titles: title,
  });

  const data = await fetchJson<WikiResponse>(`${WIKI_API}?${params}`);
  const page = data?.query?.pages?.[0];
  if (!page || page.missing) return null;
  // 消歧義頁不是條目：它沒有座標也沒有生卒，摘要只是一串「可能是指」，
  // 存進主檔只會製造看起來有資料其實沒有的列。當成查不到，讓使用者把詞寫具體一點。
  if (page.pageprops?.disambiguation !== undefined) return null;
  return page;
}

/**
 * 最後一次機會：`srwhat=nearmatch` 只回「幾乎就是這個標題」的條目，
 * 對不上就回空——這不是模糊搜尋，猜錯條目的風險仍然沒有放進來。
 */
async function nearMatch(name: string): Promise<string> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    list: "search",
    srwhat: "nearmatch",
    srsearch: name,
  });
  const data = await fetchJson<{ query?: { search?: Array<{ title?: string }> } }>(
    `${WIKI_API}?${params}`,
  );
  return data?.query?.search?.[0]?.title ?? "";
}

/** 摘要只留第一段、砍到看得完的長度；完整內容點維基連結去看 */
function summarize(extract: string): string {
  const first = extract.split(/\n+/).find((line) => line.trim()) ?? "";
  const text = first.replace(/\s+/g, " ").trim();
  return text.length > SUMMARY_MAX ? `${text.slice(0, SUMMARY_MAX)}…` : text;
}

/**
 * 人物取生卒（P569／P570），事件取發生時間（P585）或起訖（P580／P582），
 * 其他取存續（P571／P576）。
 *
 * 有座標的只認事件時間：城市也有 P571，收下去數線就會多出一堆建城年。
 */
async function fetchSpan(entityId: string | undefined, hasCoordinate: boolean): Promise<string> {
  if (!entityId) return "";

  const params = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    props: "claims",
    ids: entityId,
  });
  const data = await fetchJson<WikidataResponse>(`${WIKIDATA_API}?${params}`);
  const claims = data?.entities?.[entityId]?.claims;
  if (!claims) return "";

  const point = year(claims.P585);
  if (point) return `${point}－${point}`;

  const from = year(claims.P580) || (hasCoordinate ? "" : year(claims.P569) || year(claims.P571));
  const to = year(claims.P582) || (hasCoordinate ? "" : year(claims.P570) || year(claims.P576));
  return from || to ? `${from}－${to}` : "";
}

/** Wikidata 的時間長這樣："+1809-02-12T00:00:00Z"，負號代表西元前 */
function year(claim: WikidataClaim[] | undefined): string {
  const time = claim?.[0]?.mainsnak?.datavalue?.value?.time;
  const match = time?.match(/^([+-])(\d+)-/);
  if (!match) return "";
  const value = Number(match[2]);
  return match[1] === "-" ? `-${value}` : String(value);
}
