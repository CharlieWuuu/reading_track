import { pickCoordinate, wikiFields } from "@/utils/wiki-parse";
import { fetchPage, nearMatch } from "./page";
import { fetchSpan } from "./wikidata";

/**
 * 用條目名反查（redirects=1 會跟著轉址），刻意不做模糊搜尋——
 * 猜錯條目的代價是把不相干的摘要補進表單，寧可查不到讓使用者自己填。
 */
export async function lookupWikipedia(name: string): Promise<Record<string, string> | null> {
  const page = (await fetchPage(name)) ?? (await fetchPage(await nearMatch(name)));
  if (!page) return null;

  const span = await fetchSpan(page.pageprops?.wikibase_item, Boolean(pickCoordinate(page)));
  return wikiFields(page, span);
}
