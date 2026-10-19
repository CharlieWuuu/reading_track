import { fetchJson } from "@/lib/metadata/http";
import { WikidataClaim } from "@/types/wiki";
import { year } from "@/utils/wiki-parse";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

type WikidataResponse = {
  entities?: Record<string, { claims?: Record<string, WikidataClaim[]> }>;
};

const NO_SPAN = { from: "", to: "" };

/**
 * 人物取生卒（P569／P570），事件取發生時間（P585）或起訖（P580／P582），
 * 其他取存續（P571／P576）。
 *
 * 有座標的只認事件時間：城市也有 P571，收下去數線就會多出一堆建城年。
 */
export async function fetchSpan(
  entityId: string | undefined,
  hasCoordinate: boolean,
): Promise<{ from: string; to: string }> {
  if (!entityId) return NO_SPAN;

  const params = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    props: "claims",
    ids: entityId,
  });
  const data = await fetchJson<WikidataResponse>(`${WIKIDATA_API}?${params}`);
  const claims = data?.entities?.[entityId]?.claims;
  if (!claims) return NO_SPAN;

  const point = year(claims.P585);
  if (point) return { from: point, to: point };

  return {
    from: year(claims.P580) || (hasCoordinate ? "" : year(claims.P569) || year(claims.P571)),
    to: year(claims.P582) || (hasCoordinate ? "" : year(claims.P570) || year(claims.P576)),
  };
}
