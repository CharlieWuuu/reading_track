import { AutofillSlug } from "@/config/autofill-sources";
import { AutofillQuery, usableSources } from "@/utils/autofill";
import { BookSlug, lookupBook } from "./books";
import { lookupMoedict, lookupWiktionary } from "./dictionary";
import { lookupWeb } from "./web";
import { lookupWikipedia } from "./wikipedia";

type Found = Record<string, string> | null;

/** 少一個 slug 編譯就不過：config 加了來源，這裡一定要有實作 */
// title、url 到這裡一定有值：runSources 先用 usableSources 濾過
const bookRunner =
  (slug: BookSlug) =>
  ({ title, language }: AutofillQuery) =>
    lookupBook(slug, title!, language);

const RUNNERS: Record<AutofillSlug, (query: AutofillQuery) => Promise<Found>> = {
  taaze: bookRunner("taaze"),
  pubu: bookRunner("pubu"),
  readmoo: bookRunner("readmoo"),
  moedict: ({ title }) => lookupMoedict(title!),
  wiktionary: ({ title }) => lookupWiktionary(title!),
  "google-books": bookRunner("google-books"),
  "open-library": bookRunner("open-library"),
  wikipedia: ({ title }) => lookupWikipedia(title!),
  web: ({ url }) => lookupWeb(url!),
};

/** 依勾選順序問，第一個查到的為止；手上的資料餵不動的來源直接略過。來源丟錯就跳過，全部都沒結果才把最後的錯丟出去 */
export async function runSources(
  sources: readonly AutofillSlug[],
  query: AutofillQuery,
): Promise<{ source: AutofillSlug; fields: Record<string, string> } | null> {
  let failure: unknown = null;
  for (const source of usableSources(sources, query)) {
    try {
      const fields = await RUNNERS[source](query);
      if (fields) return { source, fields };
    } catch (err) {
      failure = err;
    }
  }
  if (failure) throw failure;
  return null;
}
