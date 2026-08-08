import { fetchJson } from "@/lib/metadata/http";
import { EMPTY_KEYWORD_INFO, KeywordInfo } from "@/types/keyword";
import { topicLabel } from "./topicLabels";

const WIKI_API = "https://zh.wikipedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const TOPIC_API =
  "https://api.wikimedia.org/service/lw/inference/v1/models/outlink-topic-model:predict";

/** 主題信心值的門檻，太低的分類只是雜訊 */
const TOPIC_THRESHOLD = 0.5;
const MAX_TOPICS = 3;
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

type TopicPrediction = { prediction?: string[] };

/**
 * 用條目名反查（redirects=1 會跟著轉址），刻意不做模糊搜尋——
 * 猜錯條目的代價是把不相干的摘要寫進主檔，寧可查不到讓使用者自己補。
 */
export async function lookupKeyword(name: string): Promise<KeywordInfo> {
  const empty: KeywordInfo = { name, ...EMPTY_KEYWORD_INFO };

  const page = (await fetchPage(name)) ?? (await fetchPage(await nearMatch(name)));
  if (!page) return empty;

  const coordinate = page.coordinates?.[0];
  // 有座標的就當地點畫在地圖上，不再取起訖——不然城市會被建城年帶進數線
  const [span, topics] = await Promise.all([
    coordinate ? Promise.resolve("") : fetchSpan(page.pageprops?.wikibase_item),
    fetchTopics(page.title),
  ]);

  return {
    name,
    topics,
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

/** 人物取生卒（P569／P570），其他取起訖（P571／P576） */
async function fetchSpan(entityId: string | undefined): Promise<string> {
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

  const from = year(claims.P569) || year(claims.P571);
  const to = year(claims.P570) || year(claims.P576);
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

/**
 * 學科用 Wikimedia 的主題模型判定。
 *
 * 整支忽略 Geography：台灣相關的條目幾乎都會被地理訊號蓋過主題訊號，
 * 留著的話所有關鍵字都會歸到同一類，分類就沒有意義了。
 */
async function fetchTopics(title: string): Promise<string> {
  const res = await fetch(TOPIC_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lang: "zh", page_title: title }),
  }).catch(() => null);
  if (!res?.ok) return "";

  const data = (await res.json().catch(() => null)) as {
    prediction?: TopicPrediction & { results?: unknown };
  } | null;
  const raw = readTopics(data);

  return raw
    .filter((t) => !t.topic.startsWith("Geography"))
    .filter((t) => t.score >= TOPIC_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_TOPICS)
    .map((t) => topicLabel(t.topic))
    .join("、");
}

type ScoredTopic = { topic: string; score: number };

/** 模型回傳的形狀在不同版本之間換過，兩種都認 */
function readTopics(data: unknown): ScoredTopic[] {
  const prediction = (data as { prediction?: unknown })?.prediction;
  const results = (prediction as { results?: unknown })?.results;
  if (Array.isArray(results)) {
    return (results as Array<{ topic?: string; score?: number }>)
      .filter((r) => typeof r.topic === "string")
      .map((r) => ({ topic: r.topic as string, score: r.score ?? 0 }));
  }
  if (Array.isArray(prediction)) {
    return (prediction as string[]).map((topic) => ({ topic, score: 1 }));
  }
  return [];
}
