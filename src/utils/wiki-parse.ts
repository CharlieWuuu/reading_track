import { WikidataClaim, WikiPage } from "@/types/wiki";

const SUMMARY_MAX = 200;

/** 有主座標就用主座標，沒有才退而用第一個 */
export function pickCoordinate(page: WikiPage) {
  return page.coordinates?.find((c) => c.primary) ?? page.coordinates?.[0];
}

/** 摘要只留第一段、砍到看得完的長度；完整內容點維基連結去看 */
export function summarize(extract: string): string {
  const first = extract.split(/\n+/).find((line) => line.trim()) ?? "";
  const text = first.replace(/\s+/g, " ").trim();
  return text.length > SUMMARY_MAX ? `${text.slice(0, SUMMARY_MAX)}…` : text;
}

/** Wikidata 的時間長這樣："+1809-02-12T00:00:00Z"，負號代表西元前 */
export function year(claim: WikidataClaim[] | undefined): string {
  const time = claim?.[0]?.mainsnak?.datavalue?.value?.time;
  const match = time?.match(/^([+-])(\d+)-/);
  if (!match) return "";
  const value = Number(match[2]);
  return match[1] === "-" ? `-${value}` : String(value);
}

/** 維基條目換成表單的欄位鍵。座標與生卒年沒有就不給，由 fillFields 略過 */
export function wikiFields(
  page: WikiPage,
  span: { from: string; to: string },
): Record<string, string> {
  const coordinate = pickCoordinate(page);
  return {
    body: summarize(page.extract ?? ""),
    externalUrl: `https://zh.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    startYear: span.from,
    endYear: span.to,
    latitude: coordinate ? String(coordinate.lat) : "",
    longitude: coordinate ? String(coordinate.lon) : "",
  };
}
