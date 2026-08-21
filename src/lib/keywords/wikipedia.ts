import { fetchPage, nearMatch } from "@/lib/keywords/wiki-page";
import { pickCoordinate, summarize } from "@/lib/keywords/wiki-parse";
import { fetchSpan } from "@/lib/keywords/wikidata";
import { EMPTY_KEYWORD_INFO, KeywordInfo } from "@/types/keyword";

/**
 * 用條目名反查（redirects=1 會跟著轉址），刻意不做模糊搜尋——
 * 猜錯條目的代價是把不相干的摘要寫進主檔，寧可查不到讓使用者自己補。
 */
export async function lookupKeyword(name: string): Promise<KeywordInfo> {
  const empty: KeywordInfo = { name, ...EMPTY_KEYWORD_INFO };

  const page = (await fetchPage(name)) ?? (await fetchPage(await nearMatch(name)));
  if (!page) return empty;

  const coordinate = pickCoordinate(page);
  const span = await fetchSpan(page.pageprops?.wikibase_item, Boolean(coordinate));

  return {
    name,
    // 領域一律留空，自己分：模型那套分類跟「你怎麼看這些字」是兩回事
    topics: "",
    coordinates: coordinate ? `${coordinate.lat},${coordinate.lon}` : "",
    span,
    wikiUrl: `https://zh.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    summary: summarize(page.extract ?? ""),
  };
}
