import { year } from "@/lib/keywords/wiki-parse";
import { fetchJson } from "@/lib/metadata/http";
import { WikidataClaim } from "@/types/wiki";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

type WikidataResponse = {
  entities?: Record<string, { claims?: Record<string, WikidataClaim[]> }>;
};

/**
 * 人物取生卒（P569／P570），事件取發生時間（P585）或起訖（P580／P582），
 * 其他取存續（P571／P576）。
 *
 * 有座標的只認事件時間：城市也有 P571，收下去數線就會多出一堆建城年。
 */
export async function fetchSpan(
  entityId: string | undefined,
  hasCoordinate: boolean,
): Promise<string> {
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
